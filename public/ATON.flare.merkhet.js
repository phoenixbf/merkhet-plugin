/*
    ATON Merkhet
    
    Allows to track and generate records about explorative sessions 
    Requires url parameter mkhet=<freq> to start
    E.g.: mkhet=0.5

    author: bruno.fanini_AT_gmail.com

===========================================================*/
window.addEventListener('load',() => {

    let MK = new ATON.Flare();
    MK.API = `${ATON.BASE_URL}/mkhet/`;

    let PP   = new URLSearchParams(window.location.search);
    let mkhet = PP.get('mkhet');
    if (!mkhet) return;

    let rid = ATON.Utils.generateID("r");

    MK._rCount = -1;
    MK._chunkSize = 500;
    //MK._maxRecords = 1000;

    MK._bSending = false;

    MK._fname = rid + ".csv";

    MK.reset = ()=>{
        MK._tStart = undefined;
        MK._t      = 0.0;
        
        MK._rCount = 0;

        MK._csvdata = "Time, posx, posy, posz, dirx, diry, dirz";
        MK._data = [];

        MK._sid   = undefined;
    };

    MK.setup = ()=>{

        MK._freq = parseFloat(mkhet);

        ATON.on("SceneJSONLoaded", sid =>{
            MK._sid = sid.replace("/","_");
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

    MK.update = ()=>{
        if (MK._rCount < 0) return;
        if (ATON._dt < 0.0) return;

        let cpov = ATON.Nav._currPOV;
        if (!cpov) return;

        let info = ATON._renderer.info;


        if (MK._rCount >= MK._chunkSize && !MK._bSending){

            MK._bSending = true;

            ATON.Utils.postJSON(MK.API+"r/", {rid: rid, data: MK._data}, (b)=>{
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
        str += ATON.getElapsedTime().toPrecision(2) + ",";
        str += px.toPrecision(3) + ",";
        str += py.toPrecision(3) + ",";
        str += pz.toPrecision(3) + ",";

        str += dx.toPrecision(3) + ",";
        str += dy.toPrecision(3) + ",";
        str += dz.toPrecision(3); // + ",";

        MK._data.push({
            time: ATON.getElapsedTime().toPrecision(2),
            pos: [px.toPrecision(3), py.toPrecision(3), pz.toPrecision(3)],
            dir: [dx.toPrecision(3), dy.toPrecision(3), dz.toPrecision(3)]
        });
        
        MK._csvdata += str;

        //console.log(str);

        MK._rCount++;
    };

    ATON.addFlare( MK );
});