package com.nusuk.automator.ui;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import com.nusuk.automator.R;
import com.nusuk.automator.core.L;
import com.nusuk.automator.core.Links;

/**
 * Full-focus 3-second startup poster ad popup with a live 3-2-1 countdown badge in the top-right corner.
 * Shown once per app open (does not re-appear when returning from in-app screens or changing language).
 */
public final class AdPopup {
    private static boolean shownThisOpen = false;
    private static Dialog activeDialog = null;

    private AdPopup() {}

    /** Resets the one-time gate when MainActivity exits so the next fresh app open shows the ad again. */
    public static void resetOnExit() {
        shownThisOpen = false;
    }

    public static void showIfNeeded(Activity a) {
        if (shownThisOpen || a == null || a.isFinishing() || a.isDestroyed()) return;
        shownThisOpen = true;

        float dp = a.getResources().getDisplayMetrics().density;
        DisplayMetrics dm = a.getResources().getDisplayMetrics();
        int maxW = Math.min((int) (dm.widthPixels * 0.88f), (int) (360 * dp));
        int maxH = (int) (dm.heightPixels * 0.78f);

        Dialog dlg = new Dialog(a);
        dlg.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dlg.setCancelable(false);
        dlg.setCanceledOnTouchOutside(false);

        FrameLayout outer = new FrameLayout(a);
        outer.setPadding((int) (16 * dp), (int) (16 * dp), (int) (16 * dp), (int) (16 * dp));

        FrameLayout card = new FrameLayout(a);
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(0xFFFFFFFF);
        cardBg.setCornerRadius(20f * dp);
        cardBg.setStroke((int) (1.5f * dp), 0xFFBBF7D0);
        card.setBackground(cardBg);
        card.setClipToOutline(true);
        card.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View view, Outline outline) {
                outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), 20f * dp);
            }
        });

        ImageView poster = new ImageView(a);
        poster.setImageResource(R.drawable.ad_poster);
        poster.setAdjustViewBounds(true);
        poster.setScaleType(ImageView.ScaleType.FIT_CENTER);
        poster.setMaxWidth(maxW);
        poster.setMaxHeight(maxH);
        poster.setContentDescription(Links.COMPANY_NAME);
        poster.setOnClickListener(v -> Links.open(a, Links.SITE_URL));
        card.addView(poster, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT));

        // Top-left subtle brand pill
        TextView sponsor = new TextView(a);
        sponsor.setText(L.t(a, "Fynex · Sponsored"));
        sponsor.setTextColor(0xFFFFFFFF);
        sponsor.setTextSize(11);
        sponsor.setTypeface(a.getResources().getFont(R.font.plex_medium));
        sponsor.setPadding((int) (10 * dp), (int) (4 * dp), (int) (10 * dp), (int) (4 * dp));
        GradientDrawable spBg = new GradientDrawable();
        spBg.setCornerRadius(999f * dp);
        spBg.setColor(0xB80F2E1E);
        spBg.setStroke((int) (1 * dp), 0x66BBF7D0);
        sponsor.setBackground(spBg);
        FrameLayout.LayoutParams spLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.START);
        spLp.setMargins((int) (12 * dp), (int) (12 * dp), 0, 0);
        card.addView(sponsor, spLp);

        // Top-right 3-2-1 countdown corner badge
        TextView counter = new TextView(a);
        counter.setText(L.t(a, "3"));
        counter.setTextColor(0xFFFFFFFF);
        counter.setTextSize(16);
        counter.setTypeface(a.getResources().getFont(R.font.plex_medium));
        counter.setGravity(Gravity.CENTER);
        GradientDrawable cBg = new GradientDrawable();
        cBg.setShape(GradientDrawable.OVAL);
        cBg.setColor(0xD914532D);
        cBg.setStroke((int) (2 * dp), 0xFFBBF7D0);
        counter.setBackground(cBg);
        int badgeSize = (int) (36 * dp);
        FrameLayout.LayoutParams cLp = new FrameLayout.LayoutParams(badgeSize, badgeSize, Gravity.TOP | Gravity.END);
        cLp.setMargins(0, (int) (12 * dp), (int) (12 * dp), 0);
        card.addView(counter, cLp);

        FrameLayout.LayoutParams cardLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        outer.addView(card, cardLp);
        dlg.setContentView(outer);

        Window win = dlg.getWindow();
        if (win != null) {
            win.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            win.setLayout(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT);
            win.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            win.setDimAmount(0.72f);
        }

        Handler h = new Handler(Looper.getMainLooper());
        Runnable tick2 = () -> {
            if (!a.isFinishing() && !a.isDestroyed() && dlg.isShowing()) {
                counter.setText(L.t(a, "2"));
            }
        };
        Runnable tick1 = () -> {
            if (!a.isFinishing() && !a.isDestroyed() && dlg.isShowing()) {
                counter.setText(L.t(a, "1"));
            }
        };
        Runnable close = () -> {
            if (dlg.isShowing() && !a.isFinishing() && !a.isDestroyed()) {
                try { dlg.dismiss(); } catch (Exception ignored) {}
            }
        };

        dlg.setOnDismissListener(d -> {
            h.removeCallbacks(tick2);
            h.removeCallbacks(tick1);
            h.removeCallbacks(close);
            if (activeDialog == d) activeDialog = null;
        });

        activeDialog = dlg;
        try {
            dlg.show();
            h.postDelayed(tick2, 1000L);
            h.postDelayed(tick1, 2000L);
            h.postDelayed(close, 3000L);
        } catch (Exception ignored) {
            activeDialog = null;
        }
    }
}
