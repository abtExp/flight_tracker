package com.flighttracker.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class FlightWidget extends AppWidgetProvider {

    private static final String TAG = "FlightWidget";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        Log.d(TAG, "onUpdate called for " + appWidgetIds.length + " widgets");
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        Log.d(TAG, "Updating widget: " + appWidgetId);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.flight_widget);

        // Intent to launch app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_title, pendingIntent);

        try {
            // Capacitor Preferences stores data in "CapacitorStorage"
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            
            // Try raw key first, then prefixed (Capacitor sometimes uses "preference_")
            String flightsJson = prefs.getString("saved_flights", null);
            if (flightsJson == null) {
                flightsJson = prefs.getString("preference_saved_flights", "[]");
            }

            Log.d(TAG, "Loaded flights JSON: " + (flightsJson != null ? "Found data" : "Null"));

            if (flightsJson != null && !flightsJson.equals("[]")) {
                JSONArray flights = new JSONArray(flightsJson);
                if (flights.length() > 0) {
                    JSONObject nextFlight = flights.getJSONObject(0);
                    
                    String flightNum = nextFlight.optString("flightNumber", "--");
                    String depCode = nextFlight.optJSONObject("departure").optString("code", "DEP");
                    String arrCode = nextFlight.optJSONObject("arrival").optString("code", "ARR");
                    
                    String time = nextFlight.optJSONObject("departure").optString("time", "");
                    if (time.contains("T")) {
                        time = time.split("T")[1].substring(0, 5);
                    }

                    views.setTextViewText(R.id.widget_title, "Upcoming Flight");
                    views.setTextViewText(R.id.widget_flight_code, flightNum);
                    views.setTextViewText(R.id.widget_dep_city, depCode);
                    views.setTextViewText(R.id.widget_arr_city, arrCode);
                    views.setTextViewText(R.id.widget_time, time);
                } else {
                    views.setTextViewText(R.id.widget_flight_code, "No Flights");
                    views.setTextViewText(R.id.widget_dep_city, "--");
                    views.setTextViewText(R.id.widget_arr_city, "--");
                }
            } else {
                views.setTextViewText(R.id.widget_flight_code, "No Data");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
            views.setTextViewText(R.id.widget_flight_code, "Error");
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
