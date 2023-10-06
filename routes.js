const MKHET = {};

const fs      = require('fs');
const path    = require('path');
const makeDir = require('make-dir');



MKHET.init = (app)=>{
    console.log("Merkhet component started");

    MKHET.DIR_RECORDS = path.join(__dirname,"/records/");

    if (!fs.existsSync(MKHET.DIR_RECORDS)) makeDir.sync(MKHET.DIR_RECORDS);

    MKHET.sessions = {};

    app.post('/mkhet/r/', (req, res) => {
        let O = req.body;

        let rid = O.rid;

        if (!MKHET.sessions[rid]) MKHET.sessions[rid] = [];

        MKHET.sessions[rid] = MKHET.sessions[rid].concat(O.data);

        //console.log(MKHET.sessions[rid]);

        MKHET.writeCSV(rid, O.data);

        res.send(true);
    });
};

MKHET.writeCSV = (rid, records)=>{
    let fname = MKHET.DIR_RECORDS + rid + ".csv";
    
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