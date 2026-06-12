package com.tuempresa.wedding;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "DirectShare")
public class DirectSharePlugin extends Plugin {

  @PluginMethod
  public void shareToInstagramStory(PluginCall call) {
    String fileUriString = call.getString("fileUri");
    if (fileUriString == null || fileUriString.isEmpty()) {
      call.reject("fileUri is required");
      return;
    }

    if (!isInstalled("com.instagram.android")) {
      call.reject("Instagram not installed");
      return;
    }

    try {
      Uri contentUri = toContentUri(fileUriString);

      Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
      intent.setDataAndType(contentUri, "image/*");
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

      // Some devices require explicit package
      intent.setPackage("com.instagram.android");

      getContext().grantUriPermission("com.instagram.android", contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getActivity().startActivity(intent);

      JSObject ret = new JSObject();
      ret.put("ok", true);
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Failed to share to Instagram Story", e);
    }
  }

  @PluginMethod
  public void shareToWhatsApp(PluginCall call) {
    String fileUriString = call.getString("fileUri");
    if (fileUriString == null || fileUriString.isEmpty()) {
      call.reject("fileUri is required");
      return;
    }

    // WhatsApp package differs for business, but we start with the standard one.
    if (!isInstalled("com.whatsapp")) {
      call.reject("WhatsApp not installed");
      return;
    }

    try {
      Uri contentUri = toContentUri(fileUriString);

      Intent intent = new Intent(Intent.ACTION_SEND);
      intent.setType("image/*");
      intent.putExtra(Intent.EXTRA_STREAM, contentUri);
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      intent.setPackage("com.whatsapp");

      getContext().grantUriPermission("com.whatsapp", contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getActivity().startActivity(intent);

      JSObject ret = new JSObject();
      ret.put("ok", true);
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Failed to share to WhatsApp", e);
    }
  }

  private boolean isInstalled(String packageName) {
    try {
      PackageManager pm = getContext().getPackageManager();
      pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
      return true;
    } catch (Exception ignored) {
      return false;
    }
  }

  private Uri toContentUri(String fileUriString) {
    Uri fileUri = Uri.parse(fileUriString);
    File file = new File(fileUri.getPath());
    String authority = getContext().getPackageName() + ".fileprovider";
    return FileProvider.getUriForFile(getContext(), authority, file);
  }
}

