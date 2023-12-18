/*
    ATON Merkhet
    
    Allows to track and generate records about explorative sessions

    author: bruno.fanini_AT_gmail.com

===========================================================*/

window.addEventListener('load',() => {


let MK = new ATON.Flare();
MK.API = `${ATON.BASE_URL}/mkhet/`;

MK.PREC_TIME  = 2;
MK.PREC_SPACE = 3;
MK.NA_VAL     = "NA";

ATON.addFlare( MK, "Merkhet" );

MK.generateID = ()=>{
    return Math.random().toString(36).substr(2,9);
};
MK.setDuration = (d)=>{
    MK._duration = d;
};
MK.setNavModeFilter = (navmode)=>{
    MK._filterNav = navmode;
};
MK.setInterval = (f)=>{
    MK._freq = f;
};

let PP = new URLSearchParams(window.location.search);

MK._freq = undefined;
if (PP.get("mk.freq")){
    MK._freq = parseInt( PP.get('mk.freq') );
}


//MK._loadrid = PP.get('mk.load');

//if (!MK._freq && !MK._loadrid) return;

MK._bStarted = false;
MK._rCount = 0;
MK._data   = [];

// Server
MK._chunkSize = 50;  
MK._bSending = false;

let rid = "rid";
//MK._fname = rid + ".csv";
MK._sid  = undefined;

MK._tStart = undefined;
MK._vrUPy = 0.0;

MK._duration = 60;
if (PP.get('mk.dur')) MK.setDuration( parseInt( PP.get('mk.dur') ) );

MK._filterNav = undefined;
if (PP.get('mk.nav')) MK.setNavModeFilter( PP.get('mk.nav') );

MK._bCapture = false;

// Internal datachunk reset
MK.resetChunk = ()=>{
    MK._rCount = 0;
    MK._data = [];

    //MK._csvdata = "time, nav, posx, posy, posz, dirx, diry, dirz, fov\n";
};

MK.startNewRecord = ()=>{
    MK._tStart = ATON._clock.elapsedTime;
    rid = MK.generateID();
    //MK._fname = rid + ".csv";

    MK.resetChunk();
    MK._bCapture = true;
    console.log("START NEW RECORD "+rid);

    ATON.fireEvent("MK_TrackingStart");
};

MK.stopCurrentRecord = ()=>{
    if (!MK._bCapture) return;

    MK.sendDataChunk();

    MK._bCapture = false;
    console.log("STOP RECORD "+rid);

    ATON.fireEvent("MK_TrackingStop");
};

MK.start = ()=>{
    if (!MK._freq || MK._freq < 50) return;
    if (MK._bStarted) return;

    window.setInterval(MK.mark, MK._freq);
    MK._bStarted = true;

    MK.startNewRecord();
};

MK.setup = ()=>{
    MK.Inspector.init();

    ATON.on("SceneJSONLoaded", sid =>{
        MK._sid = sid.replace("/","-");
/*
        if (!MK._freq){
            if (MK._loadrid){
                
                $.get(MK.API+"r/"+MK._sid+"/"+MK._loadrid, ( data )=>{
                    MK.renderCSVRecord(data);
                    //console.log(data);
                });
            }
        }
        else {    
            //MK._fname = MK._sid+"-"+rid+".csv";
            //console.log(MK._fname);
        }
*/
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{
        if (!MK._freq) return;

        MK.resetChunk();
        MK._bCapture = true;
    });

    ATON.on("XRmode", b =>{
        if (!MK._freq) return;

        //MK.resetChunk();

        if (b){
            //if (MK._sid !== undefined) MK._fname = MK._sid+"-"+rid+"-xr.csv";
            //else MK._fname = rid+"-xr.csv";
        }
    });

    console.log("Merkhet flare initialized.");

    if (MK._freq >= 50) MK.start();
};

MK.sendDataChunk = ()=>{
    if (MK._bSending) return;

    MK._bSending = true;

    let chunk = {};
    chunk.rid  = rid;
    chunk.data = MK._data;
    chunk.sid  = MK._sid;

    ATON.Utils.postJSON(MK.API+"r/", chunk, (b)=>{
        console.log("Record sent");
        MK.resetChunk();
        MK._bSending = false;
    });
};

MK.mark = ()=>{
    if (!MK._bCapture) return;
    if (ATON._dt < 0.0) return;

    if (MK._filterNav !== undefined){
        if (MK._filterNav==="OB" && !ATON.Nav.isOrbit()) return;
        if (MK._filterNav==="FP" && !ATON.Nav.isFirstPerson()) return;
        if (MK._filterNav==="DO" && !ATON.Nav.isDevOri()) return;
        if (MK._filterNav==="VR" && !ATON.XR._bPresenting) return;
    }

    let cpov = ATON.Nav._currPOV;
    if (!cpov) return;

    //if (MK._tStart === undefined) MK._tStart = ATON._clock.elapsedTime;
    //else {
        if ((ATON._clock.elapsedTime - MK._tStart) > MK._duration){
            MK.stopCurrentRecord();
            return;
        }
    //}

    // Send data chunk
    if (MK._rCount >= MK._chunkSize) MK.sendDataChunk();

    let px = cpov.pos.x.toFixed(MK.PREC_SPACE);
    let py = cpov.pos.y.toFixed(MK.PREC_SPACE);
    let pz = cpov.pos.z.toFixed(MK.PREC_SPACE);

    let dx = ATON.Nav._vDir.x.toFixed(MK.PREC_SPACE);
    let dy = ATON.Nav._vDir.y.toFixed(MK.PREC_SPACE);
    let dz = ATON.Nav._vDir.z.toFixed(MK.PREC_SPACE);

    let fx = MK.NA_VAL;
    let fy = MK.NA_VAL;
    let fz = MK.NA_VAL;

    if (ATON._queryDataScene){
        let fp = ATON._queryDataScene.p;

        fx = fp.x.toFixed(MK.PREC_SPACE);;
        fy = fp.y.toFixed(MK.PREC_SPACE);;
        fz = fp.z.toFixed(MK.PREC_SPACE);;
    }

    let fov = parseInt(ATON.Nav.getFOV());

    let t = ATON.getElapsedTime().toFixed(MK.PREC_TIME);

    // Nav
    let nav = "";
    if (ATON.XR._bPresenting){
        if (ATON.XR._sessionType === "immersive-ar") nav = "AR";
        else nav = "VR";

        fov = MK.NA_VAL;
    }
    else {
        if (ATON.Nav.isOrbit()) nav = "OB";
        if (ATON.Nav.isFirstPerson()) nav = "FP";
        if (ATON.Nav.isDevOri()) nav = "DO";
    }

/*
    let str = "";
    
    // Time
    str += t + ",";

    str += nav + ",";

    // Position
    str += px + ",";
    str += py + ",";
    str += pz + ",";

    // Direction
    str += dx + ",";
    str += dy + ",";
    str += dz + ",";
    
    // FoV
    str += fov;

    MK._csvdata += str;
    //console.log(str);
*/

    MK._data.push({
        time: t,
        nav: nav,
        pos: [ px, py, pz ],
        dir: [ dx, dy, dz ],
        foc: [ fx, fy, fz ],
        fov: fov
    });

    MK._rCount++;
};


MK.update = ()=>{
    if (ATON.XR._bPresenting){
        MK._vrUPy = ATON.Nav._camera.matrix.elements[5];

        if (MK._vrUPy < -0.7 && MK._bCapture){
            MK.stopCurrentRecord();
        }
        if (MK._vrUPy > 0.0 && !MK._bCapture){
            MK.startNewRecord();
        }
    }
};

/*
    Inspector
========================================*/
MK.Inspector = {};

MK.Inspector.init = ()=>{
    MK.Inspector._loadedRR = {};

    if (PP.get("mk.rid")){
        let rid = PP.get('mk.rid');
    }


    ATON.FE.uiAddProfile("merkhet", ()=>{
        $("#idTopToolbar").html(""); // clear
    
    });
};

MK.Inspector.loadRecord = (data)=>{
    let rows = data.split("\n");
    let num = rows.length;
    let values;

    //console.log(rows)

    for (let m=1; m<num; m++){
        let M = rows[m];

        values = M.split(",");

        let px = parseFloat(values[1]);
        let py = parseFloat(values[2]);
        let pz = parseFloat(values[3]);

        console.log(px,py,pz);

    }
};

});