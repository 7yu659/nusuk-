package com.nusuk.automator.core;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Exposes this app's own installed APK file as a read-only content:// URI so users can share
 * the app directly to WhatsApp, Telegram, Bluetooth, or Nearby Share without external libraries.
 */
public final class ApkShareProvider extends ContentProvider {
    public static final String AUTHORITY = "com.nusuk.automator.share";

    public static Uri apkUri() {
        return new Uri.Builder()
                .scheme("content")
                .authority(AUTHORITY)
                .appendPath("NusukAuto.apk")
                .build();
    }

    public static File apkFile(Context c) {
        if (c == null) return null;
        ApplicationInfo ai = c.getApplicationInfo();
        if (ai == null || ai.publicSourceDir == null) return null;
        File f = new File(ai.publicSourceDir);
        return (f.exists() && f.canRead() && f.length() > 0) ? f : null;
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public String getType(Uri uri) {
        return "application/vnd.android.package-archive";
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File f = apkFile(getContext());
        String[] cols = projection != null ? projection : new String[]{
                OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE
        };
        String[] rowCols = new String[cols.length];
        Object[] rowVals = new Object[cols.length];
        int n = 0;
        for (String col : cols) {
            if (OpenableColumns.DISPLAY_NAME.equals(col)) {
                rowCols[n] = OpenableColumns.DISPLAY_NAME;
                rowVals[n++] = "NusukAuto.apk";
            } else if (OpenableColumns.SIZE.equals(col)) {
                rowCols[n] = OpenableColumns.SIZE;
                rowVals[n++] = f != null ? f.length() : 0L;
            }
        }
        String[] usedCols = new String[n];
        Object[] usedVals = new Object[n];
        System.arraycopy(rowCols, 0, usedCols, 0, n);
        System.arraycopy(rowVals, 0, usedVals, 0, n);
        MatrixCursor cursor = new MatrixCursor(usedCols, 1);
        cursor.addRow(usedVals);
        return cursor;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (mode == null || !mode.contains("r")) {
            throw new FileNotFoundException("Read-only provider");
        }
        File f = apkFile(getContext());
        if (f == null) throw new FileNotFoundException("Installed APK unavailable");
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }
}
