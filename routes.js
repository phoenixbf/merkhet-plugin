const MKHET = {};

const fs      = require('fs');
const path    = require('path');
const makeDir = require('make-dir');



MKHET.init = (app)=>{
    console.log("Merkhet component started");

    MKHET.DIR_RECORDS = path.join(__dirname,"/records/");

    if (!fs.existsSync(MKHET.DIR_RECORDS)) makeDir.sync(MKHET.DIR_RECORDS);

    MKHET.sessions = {};

    // API
    app.post('/mkhet/r/', (req, res) => {
        let O = req.body;

        let rid = O.rid;
        let sid = O.sid;

        if (sid){
            let sidpath = path.join(MKHET.DIR_RECORDS, "/"+sid+"/");
            if (!fs.existsSync(sidpath)) makeDir.sync(sidpath);
        }

        if (!MKHET.sessions[rid]) MKHET.sessions[rid] = [];

        MKHET.sessions[rid] = MKHET.sessions[rid].concat(O.data);

        //console.log(MKHET.sessions[rid]);

        MKHET.writeCSV(rid, O.data, sid);

        res.send(true);
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
    let header = "Time, posx, posy, posz, dirx, diry, dirz\n";

    for (let r in records){
        strdata += records[r].time + ",";

        strdata += records[r].pos[0] + ",";
        strdata += records[r].pos[1] + ",";
        strdata += records[r].pos[2] + ",";

        strdata += records[r].dir[0] + ",";
        strdata += records[r].dir[1] + ",";
        strdata += records[r].dir[2];

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