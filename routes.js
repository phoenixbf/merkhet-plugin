const MKHET = {};

const fs      = require('fs');
const path    = require('path');
const makeDir = require('make-dir');
const fg      = require('fast-glob');

MKHET.API = "/mkhet/";

MKHET.init = (app)=>{
    console.log("[Merkhet Flare] started");

    let configpath = path.join(__dirname,"config.json");
	if (fs.existsSync(configpath)){
		MKHET.conf = JSON.parse(fs.readFileSync(configpath, 'utf8'));
		console.log("[Merkhet Flare] Found custom config "+configpath);
    }

    if (MKHET.conf.recordsfolder) MKHET.DIR_RECORDS = MKHET.conf.recordsfolder;
    else MKHET.DIR_RECORDS = path.join(__dirname,"/records/");

    if (!fs.existsSync(MKHET.DIR_RECORDS)) makeDir.sync(MKHET.DIR_RECORDS);

    //MKHET.sessions = {};

    // API
    app.post(MKHET.API+'r/', (req, res) => {
        let O = req.body;

        let rid = O.rid;
        let sid = O.sid;

        if (sid){
            let sidpath = path.join(MKHET.DIR_RECORDS, "/"+sid+"/");
            if (!fs.existsSync(sidpath)) makeDir.sync(sidpath);
        }

        //if (!MKHET.sessions[rid]) MKHET.sessions[rid] = [];
        //MKHET.sessions[rid] = MKHET.sessions[rid].concat(O.data);

        //console.log(MKHET.sessions[rid]);

        MKHET.writeCSV(rid, O.data, sid);

        res.send(true);
    });

    app.get(MKHET.API+"r/:sid/:rid", (req,res,next)=>{

        let sid = req.params.sid;
        let rid = req.params.rid;

        if (rid==="@"){
            let sidfolder = MKHET.DIR_RECORDS + sid;
            console.log(sidfolder)

            let frecords = fg.sync("*.*", {cwd: sidfolder, follow: true});
            console.log(frecords)
            res.send(frecords);
        }
        else {
            let rpath = path.join( MKHET.DIR_RECORDS, sid+"/"+rid );
            res.sendFile( rpath );
        }

        //next();
    });
};

MKHET.generateYMD = ()=>{
    let today = new Date();
    let dd   = String( today.getDate() );
    let mm   = String( today.getMonth()+1 ); 
    let yyyy = String( today.getFullYear() );
    if(dd<10) dd = '0'+dd;
    if(mm<10) mm = '0'+mm;

    return yyyy+mm+dd;
};

MKHET.writeCSV = (rid, records, subf)=>{
    let fname = MKHET.DIR_RECORDS;
    if (subf) fname += "/"+subf+"/";

    fname += MKHET.generateYMD() + "-" + rid + ".csv";
    
    //let records = MKHET.sessions[rid];
    if (!records) return;

    let strdata = "";
    let header = "time, nav, posx, posy, posz, dirx, diry, dirz, fx, fy, fz, fov\n";

    for (let r in records){
        let R = records[r];

        strdata += R.time + ",";

        strdata += R.nav + ",";

        strdata += R.pos[0] + ",";
        strdata += R.pos[1] + ",";
        strdata += R.pos[2] + ",";

        strdata += R.dir[0] + ",";
        strdata += R.dir[1] + ",";
        strdata += R.dir[2] + ",";

        strdata += R.foc[0] + ",";
        strdata += R.foc[1] + ",";
        strdata += R.foc[2] + ",";

        strdata += R.fov;

        strdata += "\n";
    }

    if (!fs.existsSync(fname)) fs.writeFile(fname, header + strdata, 'utf8', err => {
        if (err) throw err;
        
        console.log("CSV created: "+fname);
    });

    else fs.appendFile(fname, strdata, 'utf8', err => {
        if (err) throw err;
        
        console.log("Chunk added in CSV:"+fname);
    });

};

module.exports = MKHET;