package com.nusuk.automator.core;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.Toast;

/** Outside links and sharing helpers shared across every screen. */
public final class Links {
    static final String GROUP_URL = "https://www.facebook.com/groups/nusukauto/";
    public static final String FB_PROFILE_URL = "https://www.facebook.com/share/1CnXaXQFoL/";
    public static final String WHATSAPP_NUMBER = "01305359691";
    public static final String WHATSAPP_URL = "https://wa.me/8801305359691";
    public static final String DEV_EMAIL = "skyebrahimkhalil@gmail.com";
    public static final String DEV_URL = "mailto:skyebrahimkhalil@gmail.com";
    public static final String GITHUB_REPO = "7yu659/Nusuk";
    public static final String GITHUB_URL = "https://github.com/7yu659";
    public static final String GITHUB_RELEASES_URL = "https://github.com/" + GITHUB_REPO + "/releases";
    public static final String WEB_URL = "https://fynex.site/";
    public static final String DEV_NAME = "Ebrahim Khalil";
    public static final String COMPANY_NAME = "Fynex";
    /** Fallback link shared when APK file sharing isn't supported by the target app. */
    public static final String SHARE_URL = FB_PROFILE_URL;

    private Links() {}

    /** Nusuk's own app (the one we automate). */
    public static final String NUSUK_PACKAGE = "com.moh.nusukapp";
    /** Official website and release hosts. */
    public static final String SITE_HOST = "fynex.site";
    public static final String SITE_URL = "https://" + SITE_HOST;
    public static final String FILE_HOST = "https://fynex.site/";

    /** Hosts trusted for in-app notice or update links. */
    private static final String[] TRUSTED_HOSTS = {
            "fynex.site", "facebook.com", "fb.com", "fb.me",
            "github.com", "githubusercontent.com", "objects.githubusercontent.com",
            "play.google.com", "youtube.com", "youtu.be", "wa.me", "whatsapp.com", "t.me"
    };

    public static boolean isTrusted(String url) {
        if (url == null || !url.startsWith("https://")) return false;
        String host = Uri.parse(url).getHost();
        if (host == null) return false;
        host = host.toLowerCase(java.util.Locale.ROOT);
        for (String h : TRUSTED_HOSTS) if (host.equals(h) || host.endsWith("." + h)) return true;
        return false;
    }

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences("links", Context.MODE_PRIVATE);
    }

    /** Remembers the admin's group link from the server so every screen uses it. */
    public static void saveGroupUrl(Context c, String url) {
        if (isTrusted(url)) prefs(c).edit().putString("group", url).apply();
    }

    public static String groupUrl(Context c) {
        return prefs(c).getString("group", GROUP_URL);
    }

    /** Opens a Facebook page or profile in Facebook app / Lite, falling back to browser. */
    public static void openFacebook(Context c, String url) {
        for (String pkg : new String[]{"com.facebook.katana", "com.facebook.lite"}) {
            try {
                c.getPackageManager().getPackageInfo(pkg, 0);
                Intent fb = new Intent(Intent.ACTION_VIEW, Uri.parse("fb://facewebmodal/f?href=" + Uri.encode(url)));
                fb.setPackage(pkg);
                c.startActivity(fb);
                return;
            } catch (Exception ignored) {}
        }
        open(c, url);
    }

    /** Opens WhatsApp chat with the developer. */
    public static void openWhatsApp(Context c) {
        open(c, WHATSAPP_URL);
    }

    /**
     * Shares the installed APK file directly so the recipient can install it via WhatsApp,
     * Telegram, Nearby Share, or Bluetooth; if APK sharing is unavailable, shares the
     * developer's Facebook link instead.
     */
    public static void share(Context c) {
        String msg = L.isBn(c)
                ? "নুসুক অ্যাপের কোড আর কুইজ নিজে থেকেই করে দেয় Nusuk Auto।\n" + SHARE_URL
                : "Nusuk Auto adds Umrah codes and plays the Nusuk quiz for you.\n" + SHARE_URL;

        if (ApkShareProvider.apkFile(c) != null) {
            try {
                Uri uri = ApkShareProvider.apkUri();
                Intent sendApk = new Intent(Intent.ACTION_SEND)
                        .setType("application/vnd.android.package-archive")
                        .putExtra(Intent.EXTRA_STREAM, uri)
                        .putExtra(Intent.EXTRA_SUBJECT, "Nusuk Auto")
                        .putExtra(Intent.EXTRA_TEXT, msg)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                c.startActivity(Intent.createChooser(sendApk, L.t(c, "Share the app")));
                return;
            } catch (Exception ignored) {}
        }

        Intent sendText = new Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_SUBJECT, "Nusuk Auto")
                .putExtra(Intent.EXTRA_TEXT, msg);
        try {
            c.startActivity(Intent.createChooser(sendText, L.t(c, "Share the app")));
        } catch (Exception e) {
            Toast.makeText(c, SHARE_URL, Toast.LENGTH_LONG).show();
        }
    }

    public static void open(Context c, String url) {
        try {
            c.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception e) {
            Toast.makeText(c, url, Toast.LENGTH_LONG).show();
        }
    }

    /** Edge-to-edge (Android 15+): pads [bar] below the status bar and [content] above the nav bar. */
    public static void applyInsets(View root, View bar, View content) {
        int barTop = bar.getPaddingTop();
        int contentBottom = content.getPaddingBottom();
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            bar.setPadding(bar.getPaddingLeft(), barTop + insets.getSystemWindowInsetTop(),
                    bar.getPaddingRight(), bar.getPaddingBottom());
            content.setPadding(content.getPaddingLeft(), content.getPaddingTop(),
                    content.getPaddingRight(), contentBottom + insets.getSystemWindowInsetBottom());
            return insets;
        });
    }
}
