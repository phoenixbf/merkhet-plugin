/*
    ATON Merkhet
    
    Allows to track and generate records about explorative sessions

    author: bruno.fanini_AT_gmail.com

===========================================================*/
window.addEventListener('load',() => {

    let MK = new ATON.Flare();
    MK.API = `${ATON.BASE_URL}/mkhet/`;

    MK.PREC_TIME  = 4;
    MK.PREC_SPACE = 3;

    MK.generateID = ()=>{ return Math.random().toString(36).substr(2,9); };

    let PP   = new URLSearchParams(window.location.search);
    
    let freq = PP.get('mk.freq');
    MK._loadrid = PP.get('mk.load');

    if (!freq && !MK._loadrid) return;

    MK._rCount = 0;
    MK._data   = [];
    
    // Server
    MK._chunkSize = 50;  
    MK._bSending = false;
    
    let rid = MK.generateID();
    MK._fname = rid + ".csv";
    MK._freq = undefined;
    MK._sid  = undefined;

    MK._tStart = undefined;
    
    MK._duration = 60;
    if (PP.get('mk.dur')) MK._duration = parseInt( PP.get('mk.dur') );

    MK._filterNav = undefined;
    if (PP.get('mk.nav')) MK._filterNav = parseInt( PP.get('mk.nav') );

    MK._bCapture = false;

    MK.resetChunk = ()=>{
        MK._rCount = 0;

        MK._csvdata = "time, nav, posx, posy, posz, dirx, diry, dirz, fov";
        MK._data = [];
    };

    MK.setup = ()=>{
        MK._freq = parseInt(freq);
        if (MK._freq >= 50){
            window.setInterval(MK.mark, MK._freq);
        }

        ATON.on("SceneJSONLoaded", sid =>{
            MK._sid = sid.replace("/","-");

            if (!MK._freq){
                if (MK._loadrid){
                    
                    $.get(MK.API+"r/"+MK._sid+"/"+MK._loadrid, ( data )=>{
                        MK.renderCSVRecord(data);
                        //console.log(data);
                    });
                }
            }
            else {    
                MK._fname = MK._sid+"-"+rid+".csv";
                console.log(MK._fname);
            }
        });

        ATON.on("AllNodeRequestsCompleted", ()=>{
            if (!MK._freq) return;

            MK.resetChunk();
            MK._bCapture = true;
        });

        ATON.on("XRmode", b =>{
            if (!MK._freq) return;

            MK.resetChunk();

            if (b){
                if (MK._sid !== undefined) MK._fname = MK._sid+"-"+rid+"-xr.csv";
                else MK._fname = rid+"-xr.csv";
            }
        });

        console.log("Merkhet flare initialized.");
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
        }

        let cpov = ATON.Nav._currPOV;
        if (!cpov) return;

        if (MK._tStart === undefined) MK._tStart = ATON._clock.elapsedTime;
        else {
            if ((ATON._clock.elapsedTime - MK._tStart) > MK._duration){
                MK.sendDataChunk();
                
                MK._bCapture = false;
                console.log("END");
                return;
            }
        }

        // Send data chunk
        if (MK._rCount >= MK._chunkSize) MK.sendDataChunk();

/*
        if (MK._rCount >= MK._chunkSize){
            ATON.Utils.downloadText(MK._csvdata, MK._fname);
            //console.log(MK._data)


            ATON.Utils.postJSON(MK.API+"r/", {rid: rid, data: MK._data}, (b)=>{
                console.log("Record sent");
            });
            
            MK.resetChunk();

            MK._rCount = -1;
            return;
        }
*/

        let px = cpov.pos.x;
        let py = cpov.pos.y;
        let pz = cpov.pos.z;

        let dx = ATON.Nav._vDir.x;
        let dy = ATON.Nav._vDir.y;
        let dz = ATON.Nav._vDir.z;

        let fov = parseInt(ATON.Nav.getFOV());

        let str = "\n";
        
        // Time
        str += ATON.getElapsedTime().toPrecision(MK.PREC_TIME) + ",";

        // Nav
        let nav = "";
        if (ATON.XR._bPresenting){
            if (ATON.XR._sessionType === "immersive-ar") nav = "AR";
            else nav = "VR";
        }
        else {
            if (ATON.Nav.isOrbit()) nav = "OB";
            if (ATON.Nav.isFirstPerson()) nav = "FP";
            if (ATON.Nav.isDevOri()) nav = "DO";
        }

        str += nav + ",";

        // Position
        str += px.toPrecision(MK.PREC_SPACE) + ",";
        str += py.toPrecision(MK.PREC_SPACE) + ",";
        str += pz.toPrecision(MK.PREC_SPACE) + ",";

        // Direction
        str += dx.toPrecision(MK.PREC_SPACE) + ",";
        str += dy.toPrecision(MK.PREC_SPACE) + ",";
        str += dz.toPrecision(MK.PREC_SPACE) + ",";
        
        // FoV
        str += fov;

        MK._data.push({
            time: ATON.getElapsedTime().toPrecision(MK.PREC_TIME),
            nav: nav,
            pos: [ px.toPrecision(MK.PREC_SPACE), py.toPrecision(MK.PREC_SPACE), pz.toPrecision(MK.PREC_SPACE) ],
            dir: [ dx.toPrecision(MK.PREC_SPACE), dy.toPrecision(MK.PREC_SPACE), dz.toPrecision(MK.PREC_SPACE) ],
            fov: fov
        });
        
        MK._csvdata += str;

        //console.log(str);

        MK._rCount++;
    };

/*
    MK.update = ()=>{

    };
*/

    MK.renderCSVRecord = (data)=>{
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

    ATON.addFlare( MK );
});