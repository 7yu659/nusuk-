package com.nusuk.automator.ui;

import android.content.Intent;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nusuk.automator.R;
import com.nusuk.automator.core.Links;

/** About the developer: who built the app, where to find them, and what the app is. */
public class DeveloperActivity extends ScreenActivity {

    @Override
    protected String screenTitle() {
        return "About developer";
    }

    /** One tappable link: line icon, title, small address under it, chevron. */
    private LinearLayout linkRow(int iconRes, String title, String sub, Runnable open) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setMinimumHeight(px(64));
        row.setPadding(px(16), px(8), px(14), px(8));
        android.util.TypedValue tv = new android.util.TypedValue();
        getTheme().resolveAttribute(android.R.attr.selectableItemBackground, tv, true);
        row.setBackgroundResource(tv.resourceId);
        row.setClickable(true);
        row.setFocusable(true);
        row.setOnClickListener(v -> open.run());

        FrameLayout disc = new FrameLayout(this);
        ImageView ic = icon(iconRes, 22);
        FrameLayout.LayoutParams ip = new FrameLayout.LayoutParams(px(22), px(22), Gravity.CENTER);
        disc.addView(ic, ip);
        row.addView(disc, new LinearLayout.LayoutParams(px(40), px(40)));

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.addView(text(title, 16, getColor(R.color.text_primary)));
        TextView s = new TextView(this); // address, never translated
        s.setText(sub);
        s.setTextSize(14);
        s.setTextColor(getColor(R.color.text_secondary));
        col.addView(s, lp(-2, -2, 1));
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(0, -2, 1);
        cp.setMarginStart(px(12));
        row.addView(col, cp);

        row.addView(icon(R.drawable.ic_chevron, 18));
        return row;
    }

    private View divider() {
        View d = new View(this);
        d.setBackgroundColor(0xFFF0EEEC);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, px(1));
        p.setMarginStart(px(68));
        d.setLayoutParams(p);
        return d;
    }

    @Override
    protected void build() {
        // ----- who -----
        LinearLayout c = card(0);
        c.setGravity(Gravity.CENTER_HORIZONTAL);
        c.setPadding(px(20), px(28), px(20), px(24));

        TextView monogram = new TextView(this);
        monogram.setText("EK");
        monogram.setTextColor(0xFFFFFFFF);
        monogram.setTextSize(30);
        monogram.setTypeface(getResources().getFont(R.font.plex_medium));
        monogram.setGravity(Gravity.CENTER);
        monogram.setBackgroundResource(R.drawable.avatar_bg);
        monogram.setContentDescription(Links.DEV_NAME);
        c.addView(monogram, new LinearLayout.LayoutParams(px(88), px(88)));

        TextView name = text(Links.DEV_NAME, 22, getColor(R.color.text_primary));
        name.setTypeface(getResources().getFont(R.font.plex_medium));
        name.setGravity(Gravity.CENTER);
        c.addView(name, lp(-2, -2, 14));
        TextView role = text("Developer of Nusuk Auto", 15, getColor(R.color.text_secondary));
        role.setGravity(Gravity.CENTER);
        c.addView(role, lp(-2, -2, 3));

        // ----- where to find them -----
        label("Connect", 22);
        LinearLayout links = card(8);
        links.setPadding(0, px(4), 0, px(4));
        links.addView(linkRow(R.drawable.ic_globe_line, "Email", Links.DEV_EMAIL, () -> {
            try {
                startActivity(new Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:" + Links.DEV_EMAIL)));
            } catch (Exception ignored) {
                Links.open(this, Links.DEV_URL);
            }
        }));
        links.addView(divider());
        links.addView(linkRow(R.drawable.ic_github_line, "GitHub", "github.com/ebrahimkhalil",
                () -> Links.open(this, Links.GITHUB_URL)));
        links.addView(divider());
        links.addView(linkRow(R.drawable.ic_group_line, "Facebook group", "facebook.com/groups/nusukauto",
                () -> Links.openFacebook(this, Links.groupUrl(this))));

        // ----- the app -----
        label("About the app", 22);
        LinearLayout about = card(8);
        about.addView(text("Nusuk Auto is an unofficial helper made for Nusuk users. It is not connected to the Nusuk app or the Ministry of Hajj and Umrah.", 15, 0xFF44403C));
        about.addView(text("Questions, problems or ideas? Open Help for step-by-step fixes, or write in the Facebook group or to the developer.", 15, 0xFF44403C), lp(-1, -2, 10));
        String v = com.nusuk.automator.core.AppInfo.versionName(this);
        about.addView(text("Version " + v, 14, getColor(R.color.text_secondary)), lp(-2, -2, 12));
    }
}
