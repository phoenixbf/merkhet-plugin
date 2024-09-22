/*
    ATON Merkhet
    
    Allows to track and generate records about explorative sessions

    author: bruno.fanini_AT_gmail.com

===========================================================*/
{
    let MK = new ATON.Flare("merkhet");

    MK.PREC_TIME  = 2;
    MK.PREC_SPACE = 3;
    MK.NA_VAL     = "NA";

    MK.bReady     = false;
    MK.bAllLoaded = true;

    MK.setHub = (addr)=>{
        MK.log("Hub Address: "+addr);

        if (!addr.endsWith("/")) addr += "/";

        ATON.loadScript(addr+"capture.js", ()=>{
            CaptureHub.setHubServer(addr);
            CaptureHub.setOnFrame( MK.onFrame );

            MK.bReady = true;

            MK.log("READY");

            MK.setupUI();
            MK.tryStart();
        });
    };

    MK.setDuration = (d)=>{
        MK._duration = d;
    };
    MK.setNavModeFilter = (navmode)=>{
        MK._filterNav = navmode;
    };

    MK.onFrame = ()=>{
        let S = {};
        
        S.t = ATON.getElapsedTime().toFixed(MK.PREC_TIME);

        S.nav = "";
        if (ATON.XR._bPresenting){
            if (ATON.XR._sessionType === "immersive-ar") S.nav = "AR";
            else S.nav = "VR";

            S.fov = MK.NA_VAL;
        }
        else {
            if (ATON.Nav.isOrbit())       S.nav = "OB";
            if (ATON.Nav.isFirstPerson()) S.nav = "FP";
            if (ATON.Nav.isDevOri())      S.nav = "DO";
        }

        let cpov = ATON.Nav._currPOV;
        let vdir = ATON.Nav._vDir;
        //if (!cpov) return;

        S.posx = cpov.pos.x.toFixed(MK.PREC_SPACE);
        S.posy = cpov.pos.y.toFixed(MK.PREC_SPACE);
        S.posz = cpov.pos.z.toFixed(MK.PREC_SPACE);

        S.dirx = vdir.x.toFixed(MK.PREC_SPACE);
        S.diry = vdir.y.toFixed(MK.PREC_SPACE);
        S.dirz = vdir.z.toFixed(MK.PREC_SPACE);

        S.selx = MK.NA_VAL;
        S.sely = MK.NA_VAL;
        S.selz = MK.NA_VAL;

        if (ATON._queryDataScene){
            let fp = ATON._queryDataScene.p;

            S.selx = fp.x.toFixed(MK.PREC_SPACE);
            S.sely = fp.y.toFixed(MK.PREC_SPACE);
            S.selz = fp.z.toFixed(MK.PREC_SPACE);
        }

        S.fov = parseInt(ATON.Nav.getFOV());

        return S;
    };

    // Params
    let PP = new URLSearchParams(window.location.search);

    let hubaddr = PP.get("mk.hub");

    if (hubaddr){
        MK.setHub( String(PP.get("mk.hub")) );
    }

    MK._freq = undefined;
    if (PP.get("mk.freq")){
        MK._freq = parseInt( PP.get('mk.freq') );
    }

    let rid = "rid";
    MK._sid  = undefined;

    MK._tStart = undefined;
    MK._vrUPy = 0.0;

    MK._duration = 60; // Seconds
    if (PP.get('mk.dur')) MK.setDuration( parseInt( PP.get('mk.dur') ) );

    MK._filterNav = undefined;
    if (PP.get('mk.nav')) MK.setNavModeFilter( PP.get('mk.nav') );


    MK.setup = ()=>{
        ATON.on("SceneJSONLoaded", sid =>{
            MK._sid = sid.replace("/","-");
        });

        ATON.on("AllNodeRequestsCompleted", ()=>{
            MK.bAllLoaded = true;

            MK.tryStart();
        });

        ATON.on("XRmode", b =>{
            if (!MK._freq) return;

            if (b){
                //if (MK._sid !== undefined) MK._fname = MK._sid+"-"+rid+"-xr.csv";
                //else MK._fname = rid+"-xr.csv";
            }
        });

        MK.log("initialized.");
    };

    MK.tryStart = ()=>{
        if (!MK.bAllLoaded) return;
        if (!MK.bReady) return;
        if (!MK._sid) return;

        if (CaptureHub.isRecording()) return;

        CaptureHub.setGroupID(MK._sid);
        CaptureHub.start();

        MK._tStart = ATON._clock.elapsedTime;
    };


    MK.update = ()=>{
        if (!MK.bReady) return;

        if (CaptureHub.isRecording()){
            if ((ATON._clock.elapsedTime - MK._tStart) > MK._duration){
                CaptureHub.stop();
                MK.log("STOP recording (max duration)");
                return;
            }
        }

        if (ATON.XR._bPresenting){
            MK._vrUPy = ATON.Nav._camera.matrix.elements[5];

            if (MK._vrUPy < -0.7 && MK._bCapture){
                CaptureHub.stop();
            }
            if (MK._vrUPy > 0.0 && !MK._bCapture){
                MK.tryStart();
            }
        }
    };

    MK.setupUI = ()=>{
        if (!CaptureHub.getHubServer()) return;

        ATON.FE.uiAddButton("idTopToolbar","/flares/merkhet/icon.png", MK.popupSession);
    };

    MK.popupSession = ()=>{
        let htmlcontent = "<div class='atonPopupTitle'>Merkhet Flare</div>";

        if (CaptureHub.isRecording()){
            htmlcontent += "Current Session ID:<br><b>"+CaptureHub._id+"<b><br><br>";
            htmlcontent += "<div class='atonBTN atonBTN-rec atonBTN-horizontal' id='btnMK'>STOP</div>";
        }
        else {
            if (CaptureHub._id) htmlcontent += "Last Session ID:<br><b>"+CaptureHub._id+"<b><br><br>";
            htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal' id='btnMK'>START</div>";
        }

        if ( !ATON.FE.popupShow(htmlcontent) ) return;

        $("#btnMK").click(()=>{
            if (CaptureHub.isRecording()) CaptureHub.stop();
            else MK.tryStart();

            ATON.FE.popupClose();
        });
    };
}