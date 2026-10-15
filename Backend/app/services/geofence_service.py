import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great circle distance between two points on the earth in meters.
    """
    R = 6371000.0  # Earth radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return distance

def verify_geofence(
    user_lat: float,
    user_lng: float,
    office_lat: float,
    office_lng: float,
    radius_meters: float
) -> dict:
    """
    Validates if coordinates are within the permitted workplace geofence radius.
    """
    distance = calculate_haversine_distance(user_lat, user_lng, office_lat, office_lng)
    is_inside = distance <= radius_meters

    return {
        "distance_meters": round(distance, 2),
        "radius_meters": radius_meters,
        "is_inside": is_inside
    }
