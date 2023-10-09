/*
    ATON Merkhet
    
    Allows to track and generate records about explorative sessions 
    Requires url parameter mkhet=<freq_msec> to start
    E.g.: mkhet=500

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
    if (!freq) return;

    MK._rCount = -1;
    MK._chunkSize = 100;
    //MK._maxRecords = 1000;    
    MK._bSending = false;

    let rid = MK.generateID();
    MK._fname = rid + ".csv";
    MK._sid = undefined;

    MK.reset = ()=>{
        MK._tStart = undefined;
        MK._t      = 0.0;
        
        MK._rCount = 0;

        MK._csvdata = "Time, posx, posy, posz, dirx, diry, dirz";
        MK._data = [];
    };

    MK.setup = ()=>{
        MK._freq = parseInt(freq);
        if (MK._freq >= 100) window.setInterval(MK.mark, MK._freq);

        ATON.on("SceneJSONLoaded", sid =>{
            MK._sid = sid.replace("/","-");
            MK._fname = MK._sid+"-"+rid+".csv";
            console.log(MK._fname)
        });

        ATON.on("AllNodeRequestsCompleted", ()=>{
            MK.reset();
        });

        ATON.on("XRmode", b =>{
            MK.reset();

            if (b){
                if (MK._sid !== undefined) MK._fname = MK._sid+"-"+rid+"-xr.csv";
                else MK._fname = rid+"-xr.csv";
            }
        });

        console.log("Merkhet flare initialized.");
    };
/*
    MK.update = ()=>{

    };
*/
    MK.mark = ()=>{
        if (MK._rCount < 0) return;
        if (ATON._dt < 0.0) return;

        let cpov = ATON.Nav._currPOV;
        if (!cpov) return;

        // Send data chunk
        if (MK._rCount >= MK._chunkSize && !MK._bSending){

            MK._bSending = true;

            let chunk = {};
            chunk.rid  = rid;
            chunk.data = MK._data;
            chunk.sid  = MK._sid;

            ATON.Utils.postJSON(MK.API+"r/", chunk, (b)=>{
                console.log("Record sent");
                MK.reset();
                MK._bSending = false;
            });
        }

/*
        if (MK._rCount >= MK._chunkSize){
            ATON.Utils.downloadText(MK._csvdata, MK._fname);
            //console.log(MK._data)


            ATON.Utils.postJSON(MK.API+"r/", {rid: rid, data: MK._data}, (b)=>{
                console.log("Record sent");
            });
            
            MK.reset();

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

        let str = "\n";
        str += ATON.getElapsedTime().toPrecision(MK.PREC_TIME) + ",";
        str += px.toPrecision(MK.PREC_SPACE) + ",";
        str += py.toPrecision(MK.PREC_SPACE) + ",";
        str += pz.toPrecision(MK.PREC_SPACE) + ",";

        str += dx.toPrecision(MK.PREC_SPACE) + ",";
        str += dy.toPrecision(MK.PREC_SPACE) + ",";
        str += dz.toPrecision(MK.PREC_SPACE); // + ",";

        MK._data.push({
            time: ATON.getElapsedTime().toPrecision(MK.PREC_TIME),
            pos: [ px.toPrecision(MK.PREC_SPACE), py.toPrecision(MK.PREC_SPACE), pz.toPrecision(MK.PREC_SPACE) ],
            dir: [ dx.toPrecision(MK.PREC_SPACE), dy.toPrecision(MK.PREC_SPACE), dz.toPrecision(MK.PREC_SPACE) ]
        });
        
        MK._csvdata += str;

        //console.log(str);

        MK._rCount++;
    };

    ATON.addFlare( MK );
});