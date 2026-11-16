package com.nusuk.automator.update;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.nusuk.automator.R;
import com.nusuk.automator.core.AppInfo;
import com.nusuk.automator.core.L;
import com.nusuk.automator.core.Links;

/**
 * Mandatory GitHub-driven update checker.
 * Checks GitHub Releases (`api.github.com/repos/7yu659/Nusuk/releases/latest`) and raw
 * `version.json` on `main`. Whenever ANY newer release/build exists on GitHub, the user
 * is blocked by an un-dismissible force-update dialog until they install the update.
 */
public final class UpdateChecker {
    private static final String TAG = "UpdateChecker";
    private static final String GITHUB_LATEST_API =
            "https://api.github.com/repos/" + Links.GITHUB_REPO + "/releases/latest";
    private static final String RAW_VERSION_URL =
            "https://raw.githubusercontent.com/" + Links.GITHUB_REPO + "/main/version.json";
    private static final String DEFAULT_URL = Links.GITHUB_RELEASES_URL;
    private static final long CHECK_MIN_GAP_MS = 15_000L; // avoids rate-limiting on rapid Activity switches
    private static final String PREFS = "update";

    private static final ExecutorService exec = Executors.newSingleThreadExecutor();
    private static final Handler main = new Handler(Looper.getMainLooper());
    private static final Pattern BUILD_TAG_RE = Pattern.compile("(?i)(?:^|[-_b])(\\d+)$");

    /** What GitHub reports, or null when up to date / unknown. */
    public static final class Info {
        public int versionCode;
        public int buildNumber;
        public String versionName = "";
        public String url = DEFAULT_URL;
        public String htmlUrl = DEFAULT_URL;
        public String notes = "";
        public String sha256 = "";
    }

    public interface Listener {
        void onChecked(Info newer);
    }

    private UpdateChecker() {}

    static int currentVersionCode(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    static int currentBuildNumber(Context c) {
        try {
            return Integer.parseInt(c.getString(R.string.github_build).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** True if a newer GitHub version is already known and must block app usage until updated. */
    public static boolean isBlocked(Context c) {
        Info cached = readCached(c);
        return cached != null && isNewer(c, cached);
    }

    /** Checks GitHub on app open/resume; forces an un-dismissible update dialog whenever any update exists. */
    public static void autoCheck(Activity a, Listener badge) {
        SharedPreferences p = prefs(a);
        Info cached = readCached(a);
        if (cached != null) {
            boolean newer = isNewer(a, cached);
            if (badge != null) badge.onChecked(newer ? cached : null);
            if (newer) {
                showForcedDialog(a, cached);
            }
        }
        long now = System.currentTimeMillis();
        if (now - p.getLong("lastCheck", 0) < CHECK_MIN_GAP_MS) return;
        fetch(a, info -> {
            p.edit().putLong("lastCheck", System.currentTimeMillis()).apply();
            if (badge != null) badge.onChecked(info);
            if (info != null) showForcedDialog(a, info);
        }, false);
    }

    /** Manual check from footer/settings: queries GitHub immediately. */
    public static void manualCheck(Activity a, Listener badge) {
        Toast.makeText(a, L.t(a, "Checking for updates..."), Toast.LENGTH_SHORT).show();
        fetch(a, info -> {
            if (badge != null) badge.onChecked(info);
            if (info != null) showForcedDialog(a, info);
            else Toast.makeText(a, L.t(a, "You have the latest version"), Toast.LENGTH_SHORT).show();
        }, true);
    }

    static boolean isNewer(Context c, Info i) {
        if (i == null) return false;
        int curCode = currentVersionCode(c);
        int curBuild = currentBuildNumber(c);
        String curName = AppInfo.versionName(c);
        if (i.versionCode > curCode) return true;
        if (i.versionCode == curCode && i.buildNumber > curBuild && curBuild > 0) return true;
        if (i.buildNumber > curBuild && curBuild > 0 && i.versionCode == 0) return true;
        return compareSemver(i.versionName, curName) > 0;
    }

    private static int compareSemver(String remote, String local) {
        if (remote == null || remote.isEmpty()) return 0;
        String rClean = remote.replaceFirst("^[vV]", "").split("[-+]")[0];
        String lClean = (local == null ? "" : local).replaceFirst("^[vV]", "").split("[-+]")[0];
        String[] rp = rClean.split("\\.");
        String[] lp = lClean.split("\\.");
        int len = Math.max(rp.length, lp.length);
        for (int k = 0; k < len; k++) {
            int rv = k < rp.length ? parseIntSafe(rp[k]) : 0;
            int lv = k < lp.length ? parseIntSafe(lp[k]) : 0;
            if (rv != lv) return Integer.compare(rv, lv);
        }
        return 0;
    }

    private static int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.replaceAll("\\D", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private static Info readCached(Context c) {
        String raw = prefs(c).getString("info", null);
        if (raw == null) return null;
        try {
            return parseInfoJson(new JSONObject(raw));
        } catch (Exception e) {
            return null;
        }
    }

    private static void saveCached(Context app, Info info) {
        try {
            JSONObject j = new JSONObject()
                    .put("versionCode", info.versionCode)
                    .put("buildNumber", info.buildNumber)
                    .put("versionName", info.versionName)
                    .put("url", info.url)
                    .put("htmlUrl", info.htmlUrl)
                    .put("notes", info.notes)
                    .put("sha256", info.sha256);
            prefs(app).edit().putString("info", j.toString()).apply();
        } catch (Exception ignored) {}
    }

    private static Info parseInfoJson(JSONObject j) {
        Info i = new Info();
        i.versionCode = j.optInt("versionCode", 0);
        i.buildNumber = j.optInt("buildNumber", 0);
        i.versionName = j.optString("versionName", "");
        i.url = j.optString("url", DEFAULT_URL);
        i.htmlUrl = j.optString("htmlUrl", i.url);
        i.notes = j.optString("notes", "");
        i.sha256 = j.optString("sha256", "");
        return i;
    }

    private static String httpGet(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestProperty("User-Agent", "NusukAuto-Android");
        conn.setRequestProperty("Accept", "application/vnd.github+json");
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        conn.setUseCaches(false);
        try {
            int code = conn.getResponseCode();
            if (code != 200) throw new Exception("HTTP " + code);
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) sb.append(line).append('\n');
            }
            return sb.toString();
        } finally {
            conn.disconnect();
        }
    }

    private static Info fetchFromGithubRelease() throws Exception {
        String body = httpGet(GITHUB_LATEST_API);
        JSONObject rel = new JSONObject(body);
        Info info = new Info();
        String tag = rel.optString("tag_name", "").trim();
        info.versionName = tag.replaceFirst("^[vV]", "").split("-")[0];
        info.htmlUrl = rel.optString("html_url", DEFAULT_URL);
        info.url = info.htmlUrl;
        info.notes = rel.optString("body", "").trim();

        Matcher bm = BUILD_TAG_RE.matcher(tag);
        if (bm.find()) info.buildNumber = parseIntSafe(bm.group(1));

        JSONArray assets = rel.optJSONArray("assets");
        String versionAssetUrl = null;
        if (assets != null) {
            for (int k = 0; k < assets.length(); k++) {
                JSONObject a = assets.optJSONObject(k);
                if (a == null) continue;
                String name = a.optString("name", "");
                String dl = a.optString("browser_download_url", "");
                if (name.endsWith(".apk") && !dl.isEmpty()) {
                    info.url = dl;
                } else if ("version.json".equalsIgnoreCase(name) && !dl.isEmpty()) {
                    versionAssetUrl = dl;
                }
            }
        }
        if (versionAssetUrl != null) {
            try {
                Info exact = parseInfoJson(new JSONObject(httpGet(versionAssetUrl)));
                if (exact.versionCode > 0) info.versionCode = exact.versionCode;
                if (exact.buildNumber > 0) info.buildNumber = exact.buildNumber;
                if (!exact.versionName.isEmpty()) info.versionName = exact.versionName;
                if (!exact.url.isEmpty()) info.url = exact.url;
                if (!exact.sha256.isEmpty()) info.sha256 = exact.sha256;
                if (!exact.notes.isEmpty()) info.notes = exact.notes;
            } catch (Exception ignored) {}
        }
        return info;
    }

    /** Queries GitHub Releases first, falling back to raw version.json on main. */
    private static void fetch(Activity a, Listener cb, boolean reportErrors) {
        final Context app = a.getApplicationContext();
        exec.execute(() -> {
            Info newer = null;
            String error = null;
            try {
                Info candidate = null;
                try {
                    candidate = fetchFromGithubRelease();
                } catch (Exception relErr) {
                    Log.w(TAG, "GitHub release check failed, trying raw version.json: " + relErr);
                    candidate = parseInfoJson(new JSONObject(httpGet(RAW_VERSION_URL + "?t=" + System.currentTimeMillis())));
                }
                if (candidate != null) {
                    saveCached(app, candidate);
                    if (isNewer(app, candidate)) newer = candidate;
                }
            } catch (Exception e) {
                Log.w(TAG, "Update check failed: " + e);
                error = e.toString();
            }
            final Info result = newer;
            final boolean failed = error != null;
            main.post(() -> {
                if (a.isFinishing() || a.isDestroyed()) return;
                if (failed && reportErrors) {
                    Toast.makeText(a, L.t(a, "Could not check for updates. Check your internet."), Toast.LENGTH_LONG).show();
                    return;
                }
                if (!failed) cb.onChecked(result);
            });
        });
    }

    private static AlertDialog shown;

    /** Shows an un-dismissible mandatory update dialog. Users cannot proceed until updated. */
    public static void showForcedDialog(Activity a, Info info) {
        if (a == null || a.isFinishing() || a.isDestroyed()) return;
        if (shown != null && shown.isShowing()) return;
        String verLabel = info.versionName != null && !info.versionName.isEmpty()
                ? "v" + info.versionName + (info.buildNumber > 0 ? " (#" + info.buildNumber + ")" : "")
                : (info.buildNumber > 0 ? "#" + info.buildNumber : "");
        String msg = L.t(a, "A new update was published on GitHub. You must install the latest version before continuing.")
                + (info.notes.isEmpty() ? "" : "\n\n" + L.t(a, "What's new:") + "\n" + info.notes)
                + "\n\n" + L.t(a, "Your progress is kept when you update.");

        AlertDialog.Builder b = new AlertDialog.Builder(a)
                .setTitle(L.t(a, "Update required") + (verLabel.isEmpty() ? "" : " (" + verLabel + ")"))
                .setMessage(msg)
                .setCancelable(false)
                .setPositiveButton(L.t(a, "Update now"), null)
                .setNeutralButton(L.t(a, "GitHub Release"), null);

        AlertDialog dlg = b.create();
        dlg.setCanceledOnTouchOutside(false);
        dlg.setOnKeyListener((d, keyCode, event) -> keyCode == KeyEvent.KEYCODE_BACK);
        dlg.setOnDismissListener(d -> { if (shown == d) shown = null; });
        shown = dlg;
        dlg.show();

        // Override button listeners after show() so tapping either button never dismisses the lock.
        dlg.getButton(DialogInterface.BUTTON_POSITIVE).setOnClickListener(v -> {
            if (info.url != null && info.url.endsWith(".apk")) {
                ApkInstaller.start(a, info);
            } else {
                openDownload(a, info);
            }
        });
        dlg.getButton(DialogInterface.BUTTON_NEUTRAL).setOnClickListener(v -> openDownload(a, info));
    }

    static void openDownload(Activity a, Info info) {
        String target = (info != null && Links.isTrusted(info.htmlUrl)) ? info.htmlUrl
                : (info != null && Links.isTrusted(info.url)) ? info.url
                : DEFAULT_URL;
        try {
            a.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            Toast.makeText(a, L.t(a, "Download the APK and install the update to continue."), Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(a, target, Toast.LENGTH_LONG).show();
        }
    }
}
