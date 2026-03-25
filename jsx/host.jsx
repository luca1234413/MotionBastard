// Motion AI Assistant - ExtendScript Host
// Phase 3: AE state reading (ES3 compatible - no JSON object)

// Simple JSON helpers for ES3
function jsonStr(s) {
    if (s === null || s === undefined) return "null";
    return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

function jsonNum(n) {
    if (n === null || n === undefined) return "null";
    return String(n);
}

function jsonBool(b) {
    return b ? "true" : "false";
}

function jsonArr(items) {
    return "[" + items.join(",") + "]";
}

// Get layer type string
function getLayerType(layer) {
    try {
        if (layer instanceof ShapeLayer) return "Shape";
        if (layer instanceof TextLayer) return "Text";
        if (layer instanceof CameraLayer) return "Camera";
        if (layer instanceof LightLayer) return "Light";
        if (layer.nullLayer) return "Null";
        if (layer.adjustmentLayer) return "Adjustment";
        if (layer.source instanceof CompItem) return "Pre-comp";
        if (layer.source) {
            var src = layer.source;
            if (src.mainSource instanceof SolidSource) return "Solid";
            if (src.mainSource instanceof FileSource) {
                var name = src.mainSource.file.name.toLowerCase();
                if (name.match(/\.(mp4|mov|avi|mkv)$/)) return "Video";
                if (name.match(/\.(mp3|wav|aac)$/)) return "Audio";
                if (name.match(/\.(png|jpg|jpeg|gif|psd|ai|svg|tif|tiff|bmp)$/)) return "Image";
            }
        }
    } catch (e) {}
    return "Layer";
}

// Status info for polling (called every ~1s)
function getStatusInfo() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return '{"connected":true,"comp":null,"layer":null}';
        }

        var layerStr = "null";
        if (comp.selectedLayers.length > 0) {
            var layer = comp.selectedLayers[0];
            layerStr = '{"name":' + jsonStr(layer.name) + ',"type":' + jsonStr(getLayerType(layer)) + ',"index":' + jsonNum(layer.index) + '}';
        }

        return '{"connected":true,"comp":' + jsonStr(comp.name) + ',"layer":' + layerStr + '}';
    } catch (e) {
        return '{"connected":true,"comp":null,"layer":null}';
    }
}

// Detailed context for Claude (called before each message)
function getCompContext() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return '{"error":"No active composition"}';
        }

        // All layers
        var allLayers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            allLayers.push('{"index":' + jsonNum(i) + ',"name":' + jsonStr(layer.name) + ',"type":' + jsonStr(getLayerType(layer)) + ',"visible":' + jsonBool(layer.enabled) + '}');
        }

        // Selected layers with detail
        var selLayers = [];
        for (var j = 0; j < comp.selectedLayers.length; j++) {
            var sel = comp.selectedLayers[j];

            var posStr = "null";
            var scaleStr = "null";
            var opacityStr = "null";

            try { 
                var pos = sel.property("Position").value;
                posStr = "[" + pos[0] + "," + pos[1] + "]";
                if (pos.length > 2) posStr = "[" + pos[0] + "," + pos[1] + "," + pos[2] + "]";
            } catch (e) {}

            try {
                var sc = sel.property("Scale").value;
                scaleStr = "[" + sc[0] + "," + sc[1] + "]";
            } catch (e) {}

            try {
                opacityStr = jsonNum(sel.property("Opacity").value);
            } catch (e) {}

            // Effects
            var fxArr = [];
            try {
                var fx = sel.property("Effects");
                for (var k = 1; k <= fx.numProperties; k++) {
                    var effect = fx.property(k);
                    fxArr.push('{"name":' + jsonStr(effect.name) + ',"matchName":' + jsonStr(effect.matchName) + ',"enabled":' + jsonBool(effect.enabled) + '}');
                }
            } catch (e) {}

            selLayers.push('{"index":' + jsonNum(sel.index) + ',"name":' + jsonStr(sel.name) + ',"type":' + jsonStr(getLayerType(sel)) + ',"inPoint":' + jsonNum(sel.inPoint) + ',"outPoint":' + jsonNum(sel.outPoint) + ',"position":' + posStr + ',"scale":' + scaleStr + ',"opacity":' + opacityStr + ',"effects":' + jsonArr(fxArr) + '}');
        }

        return '{"comp":{"name":' + jsonStr(comp.name) + ',"width":' + jsonNum(comp.width) + ',"height":' + jsonNum(comp.height) + ',"duration":' + jsonNum(comp.duration) + ',"frameRate":' + jsonNum(comp.frameRate) + ',"numLayers":' + jsonNum(comp.numLayers) + '},"selectedLayers":' + jsonArr(selLayers) + ',"allLayers":' + jsonArr(allLayers) + '}';
    } catch (e) {
        return '{"error":' + jsonStr(e.toString()) + '}';
    }
}

// Detect installed effects/plugins
function getInstalledEffects() {
    try {
        var effects = [];
        for (var i = 1; i <= app.effects.length; i++) {
            effects.push('{"name":' + jsonStr(app.effects[i].displayName) + ',"category":' + jsonStr(app.effects[i].category) + '}');
        }
        return jsonArr(effects);
    } catch (e) {
        return "[]";
    }
}
