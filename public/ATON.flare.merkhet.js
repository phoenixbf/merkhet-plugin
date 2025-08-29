/*
    ATON Merkhet
    
    Allows to track and generate records about explorative sessions

    author: bruno.fanini_AT_gmail.com

===========================================================*/
{
    let MK = new ATON.Flare("merkhet");

    MK.PREC_TIME  = 2;
    MK.PREC_SPACE = 3;
    MK.NA_VAL     = "";

    MK.ATTRIBUTES = [
        //"t",
        "nav",
        "pos",
        "dir",
        "sel",
        "fov"
    ];

    MK.bReady     = false;
    MK.bAllLoaded = true;

    MK.bPause = false;

    MK.setHub = (addr)=>{
        MK.log("Hub Address: "+addr);

        if (!addr.endsWith("/")) addr += "/";

        ATON.loadScript(addr+"kapto.js", ()=>{
            Kapto.setHubServer(addr);
            Kapto.setOnFrame( MK.onFrame );

            Kapto.setOnSessionID((sesid)=>{
                //console.log(sesid);
                MK.suiSes.setText( sesid.substr(sesid.length-4).toUpperCase() );

                ATON.Photon.fire("KaptoSessionID", sesid);
            });

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
        if (MK.bPause) return undefined;

        let S = {};

        S.t = ATON.getElapsedTime().toFixed(MK.PREC_TIME);

        let cpov = ATON.Nav._currPOV;
        let vdir = ATON.Nav._vDir;

        for (let a in MK.ATTRIBUTES){
            let attr = MK.ATTRIBUTES[a];

            if (attr==="nav"){
                S.nav = "";
                if (ATON.XR._bPresenting){
                    if (ATON.XR._sessionType === "immersive-ar") S.nav = "ar";
                    else S.nav = "vr";
                }
                else {
                    if (ATON.Nav.isOrbit())       S.nav = "ob";
                    if (ATON.Nav.isFirstPerson()) S.nav = "fp";
                    if (ATON.Nav.isDevOri())      S.nav = "do";
                }
        
                if (MK._filterNav){
                    if (MK._filterNav !== S.nav) return undefined;
                }
            }

            if (attr==="pos"){
                S.posx = cpov.pos.x.toFixed(MK.PREC_SPACE);
                S.posy = cpov.pos.y.toFixed(MK.PREC_SPACE);
                S.posz = cpov.pos.z.toFixed(MK.PREC_SPACE);
            }

            if (attr==="dir"){
                S.dirx = vdir.x.toFixed(MK.PREC_SPACE);
                S.diry = vdir.y.toFixed(MK.PREC_SPACE);
                S.dirz = vdir.z.toFixed(MK.PREC_SPACE);
            }

            if (attr==="sel"){
                S.selx = MK.NA_VAL;
                S.sely = MK.NA_VAL;
                S.selz = MK.NA_VAL;
        
                if (ATON._queryDataScene){
                    let fp = ATON._queryDataScene.p;
        
                    S.selx = fp.x.toFixed(MK.PREC_SPACE);
                    S.sely = fp.y.toFixed(MK.PREC_SPACE);
                    S.selz = fp.z.toFixed(MK.PREC_SPACE);
                }
            }

            if (attr==="fov"){
                S.fov = parseInt(ATON.Nav.getFOV());
                if (ATON.XR._bPresenting) S.fov = MK.NA_VAL;
            }

            // XR hands/controllers
            if (attr==="lh_pos"){
                S.lh_posx = MK.NA_VAL;
                S.lh_posy = MK.NA_VAL;
                S.lh_posz = MK.NA_VAL;

                let lhp = ATON.XR.getControllerWorldLocation(ATON.XR.HAND_L);
                if (ATON.XR._bPresenting && lhp){
                    S.lh_posx = lhp.x.toFixed(MK.PREC_SPACE);
                    S.lh_posy = lhp.y.toFixed(MK.PREC_SPACE);
                    S.lh_posz = lhp.z.toFixed(MK.PREC_SPACE);
                }
            }

            if (attr==="rh_pos"){
                S.rh_posx = MK.NA_VAL;
                S.rh_posy = MK.NA_VAL;
                S.rh_posz = MK.NA_VAL;

                let rhp = ATON.XR.getControllerWorldLocation(ATON.XR.HAND_R);
                if (ATON.XR._bPresenting && rhp){
                    S.rh_posx = rhp.x.toFixed(MK.PREC_SPACE);
                    S.rh_posy = rhp.y.toFixed(MK.PREC_SPACE);
                    S.rh_posz = rhp.z.toFixed(MK.PREC_SPACE);
                }
            }

            if (attr==="lh_dir"){
                S.lh_dirx = MK.NA_VAL;
                S.lh_diry = MK.NA_VAL;
                S.lh_dirz = MK.NA_VAL;

                let lhd = ATON.XR.getControllerWorldDirection(ATON.XR.HAND_L);
                if (ATON.XR._bPresenting && lhd){
                    S.lh_dirx = lhd.x.toFixed(MK.PREC_SPACE);
                    S.lh_diry = lhd.y.toFixed(MK.PREC_SPACE);
                    S.lh_dirz = lhd.z.toFixed(MK.PREC_SPACE);
                }
            }

            if (attr==="rh_dir"){
                S.rh_dirx = MK.NA_VAL;
                S.rh_diry = MK.NA_VAL;
                S.rh_dirz = MK.NA_VAL;

                let rhd = ATON.XR.getControllerWorldDirection(ATON.XR.HAND_R);
                if (ATON.XR._bPresenting && rhd){
                    S.rh_dirx = rhd.x.toFixed(MK.PREC_SPACE);
                    S.rh_diry = rhd.y.toFixed(MK.PREC_SPACE);
                    S.rh_dirz = rhd.z.toFixed(MK.PREC_SPACE);
                }
            }

            if (attr==="lh_ori"){
                S.lh_orix = MK.NA_VAL;
                S.lh_oriy = MK.NA_VAL;
                S.lh_oriz = MK.NA_VAL;
                S.lh_oriw = MK.NA_VAL;

                let lho = ATON.XR.getControllerWorldOrientation(ATON.XR.HAND_L);
                if (ATON.XR._bPresenting && lho){
                    S.lh_orix = lho.x.toFixed(MK.PREC_SPACE);
                    S.lh_oriy = lho.y.toFixed(MK.PREC_SPACE);
                    S.lh_oriz = lho.z.toFixed(MK.PREC_SPACE);
                    S.lh_oriw = lho.w.toFixed(MK.PREC_SPACE);
                }
            }

            if (attr==="rh_ori"){
                S.rh_orix = MK.NA_VAL;
                S.rh_oriy = MK.NA_VAL;
                S.rh_oriz = MK.NA_VAL;
                S.rh_oriw = MK.NA_VAL;

                let rho = ATON.XR.getControllerWorldOrientation(ATON.XR.HAND_R);
                if (ATON.XR._bPresenting && rho){
                    S.rh_orix = rho.x.toFixed(MK.PREC_SPACE);
                    S.rh_oriy = rho.y.toFixed(MK.PREC_SPACE);
                    S.rh_oriz = rho.z.toFixed(MK.PREC_SPACE);
                    S.rh_oriw = rho.w.toFixed(MK.PREC_SPACE);
                }
            }

        }

        return S;
    };

    // Params
    let PP = new URLSearchParams(window.location.search);

    let hubaddr = PP.get("mk.hub");
    if (hubaddr) MK.setHub( String(PP.get("mk.hub")) );

    MK._freq = undefined;
    if (PP.get("mk.freq")){
        MK._freq = parseInt( PP.get('mk.freq') );
    }

    let rid = "rid";
    MK._sid  = undefined;

    MK._tStart = undefined;

    MK._vrUPy = 0.0;
    MK._bFlipped = false;

    MK._duration = 60; // Seconds
    if (PP.get('mk.dur')) MK.setDuration( parseInt( PP.get('mk.dur') ) );

    MK._filterNav = undefined;
    if (PP.get('mk.nav')) MK.setNavModeFilter( PP.get('mk.nav') );

    MK._actor = undefined;
    if (PP.get('mk.actor')) MK._actor = String(PP.get('mk.actor'));

    if (PP.get('mk.attr')) MK.ATTRIBUTES = String(PP.get('mk.attr')).split(',');


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

        ATON.on("XRcontrollerConnected", (c)=>{
            if (!MK.suiSes) return;

            if (c === ATON.XR.HAND_L){
                ATON.XR.getSecondaryController().add(MK.suiSes);
                MK.suiSes.show();  
            }
        });

        MK.log("initialized.");
    };

    MK.tryStart = ()=>{
        if (!MK.bAllLoaded) return;
        if (!MK.bReady) return;
        if (!MK._sid) return;

        if (Kapto.isRecording()) return;

        Kapto.setGroupID(MK._sid);
        if (MK._actor) Kapto.setActorName(MK._actor);

        Kapto.start();

        MK._tStart = ATON._clock.elapsedTime;
    };


    MK.update = ()=>{
        if (!MK.bReady) return;

        if (Kapto.isRecording()){
            if ((ATON._clock.elapsedTime - MK._tStart) > MK._duration){
                Kapto.stop();
                MK.log("STOP recording (max duration)");
                return;
            }
        }

        if (ATON.XR._bPresenting){
            MK._vrUPy = ATON.Nav._camera.matrix.elements[5];

            if (MK._vrUPy < -0.7 && MK._bCapture && !MK._bFlipped){
                Kapto.stop();
                MK._bFlipped = true;
            }
            if (MK._vrUPy > 0.0 && !MK._bCapture && MK._bFlipped){
                MK.tryStart();
                MK._bFlipped = false;
            }
        }
    };

    MK.setupUI = ()=>{
        if (!Kapto.getHubServer()) return;

        ATON.FE.uiAddButton("idTopToolbar","/flares/merkhet/icon.png", MK.popupSession);

        MK.suiSes = new ATON.SUI.Label();
        MK.suiSes.setText("----").setBaseColor(ATON.MatHub.colors.white).setTextColor(ATON.MatHub.colors.black);;

        let pi2 = (Math.PI * 0.5);
        MK.suiSes.setPosition(-0.3,0.15,0).setRotation(-pi2,pi2,pi2).setScale(2.0);
        
        MK.suiSes.attachToRoot();
        MK.suiSes.hide();
    };

    MK.popupSession = ()=>{
        let htmlcontent = "<div class='atonPopupTitle'>Merkhet Flare</div>";

        if (Kapto.isRecording() && Kapto._id){
            htmlcontent += "Current Session ID:<br><b>"+Kapto._id+"<b><br><br>";
            htmlcontent += "<div class='atonBTN atonBTN-rec atonBTN-horizontal' id='btnMK'>STOP</div>";
        }
        else {
            if (Kapto._id) htmlcontent += "Last Session ID:<br><b>"+Kapto._id+"<b><br><br>";
            htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal' id='btnMK'>START</div>";
        }

        if ( !ATON.FE.popupShow(htmlcontent) ) return;

        $("#btnMK").click(()=>{
            if (Kapto.isRecording()) Kapto.stop();
            else MK.tryStart();

            ATON.FE.popupClose();
        });
    };
}