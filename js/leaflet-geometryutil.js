// Leaflet.GeometryUtil for area calculations
// Source: https://github.com/makinacorpus/Leaflet.GeometryUtil

(function() {
    "use strict";

    L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
        // Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270
        geodesicArea: function(latLngs) {
            var pointsCount = latLngs.length,
                area = 0.0,
                d2r = Math.PI / 180,
                p1, p2;

            if (pointsCount > 2) {
                for (var i = 0; i < pointsCount; i++) {
                    p1 = latLngs[i];
                    p2 = latLngs[(i + 1) % pointsCount];
                    area += ((p2.lng - p1.lng) * d2r) *
                            (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
                }
                area = area * 6378137.0 * 6378137.0 / 2.0;
            }

            return Math.abs(area);
        },

        readableArea: function(area, isMetric, precision) {
            var precision = precision || 2,
                areaStr,
                units;

            if (isMetric) {
                units = ['sq.m', 'ha', 'sq.km'];
                var factor = 1;
                if (area >= 1000000) {
                    areaStr = (area * 0.000001).toFixed(precision);
                    units = units[2];
                } else if (area >= 10000) {
                    areaStr = (area * 0.0001).toFixed(precision);
                    units = units[1];
                } else {
                    areaStr = area.toFixed(precision);
                    units = units[0];
                }
            } else {
                area /= 0.836127; // Square yards in 1 sq.m
                units = ['sq.yd', 'acre', 'sq.mi'];
                if (area >= 3097600) { // 3097600 sq.yd in 1 sq.mi
                    areaStr = (area / 3097600).toFixed(precision);
                    units = units[2];
                } else if (area >= 4840) { // 4840 sq.yd in 1 acre
                    areaStr = (area / 4840).toFixed(precision);
                    units = units[1];
                } else {
                    areaStr = area.toFixed(precision);
                    units = units[0];
                }
            }

            return areaStr + ' ' + units;
        }
    });
})(); 