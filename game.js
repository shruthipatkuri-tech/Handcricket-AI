setInterval(()=>{
    if(
        typeof state!=='undefined' &&
        state.phase==='complete'
    ){
        messageEl.textContent=
            'OVER COMPLETED! GOOD TRY!';
    }
},100);

import * as THREE from 'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';

setInterval(()=>{
    if(
        typeof state!=='undefined' &&
        state.phase==='complete'
    ){
        playAgainButton.style.display='block';
    }
},100);

const $=s=>document.querySelector(s);

const scoreEl=$('#score');
const wicketEl=$('#wicket');
const ballEl=$('#ballNumber');
const messageEl=$('#message');
const bowlButton=$('#bowlButton');
const playAgainButton=$('#playAgainButton');
const loadingEl=$('#loading');
const errorEl=$('#error');


/* ============================================================
   OVER AUDIO
============================================================ */

let overAudioPlayed=false;

function announceOverComplete(){

    if(overAudioPlayed)return;

    overAudioPlayed=true;

    if("speechSynthesis" in window){

        window.speechSynthesis.cancel();

        const utterance=
            new SpeechSynthesisUtterance(
                "Over completed. Good try!"
            );

        utterance.rate=.9;
        utterance.pitch=1;
        utterance.volume=1;

        window.speechSynthesis.speak(
            utterance
        );

    }

}


/* ============================================================
   GAME STATE
============================================================ */

const state={

    score:0,

    wickets:0,

    // CHANGE 1:
    // Game starts at 0/6
    ball:0,

    totalBalls:6,

    phase:'ready',

    time:0,

    shotTriggered:false,

    ballReleased:false,

    currentRuns:1,

    // 0 = no hand gesture
    shotGesture:0,

    cameraReady:false,

    handDetected:false,

    lastHandSeen:0,

    out:false

};


/* ============================================================
   HAND GESTURE
============================================================ */

window.addEventListener(
    'cricket:camera-gesture',
    event=>{

        if(
            state.phase==='run' &&
            event.detail?.gesture
        ){

            state.shotGesture=
                event.detail.gesture;

            state.handDetected=true;

            state.lastHandSeen=
                performance.now();

        }

    }
);


window.addEventListener(
    'cricket:camera-presence',
    event=>{

        state.cameraReady=
            event.detail?.available===true;

        if(event.detail?.detected){

            state.handDetected=true;

            state.lastHandSeen=
                performance.now();

        }

    }
);


/* ============================================================
   PLAY AGAIN
============================================================ */

playAgainButton.addEventListener(
    'click',
    ()=>{

        state.score=0;

        state.wickets=0;

        // CHANGE 1:
        // Reset to 0/6
        state.ball=0;

        state.phase='ready';

        state.time=0;

        state.shotTriggered=false;

        state.ballReleased=false;

        state.shotGesture=0;

        state.handDetected=false;

        state.lastHandSeen=0;

        state.out=false;

        overAudioPlayed=false;

        scoreEl.textContent='0';

        wicketEl.textContent='0';

        // CHANGE 1:
        ballEl.textContent='0/6';

        messageEl.textContent=
            'Ready for next ball';

        messageEl.classList.remove(
            'out-message'
        );

        playAgainButton.style.display=
            'none';

        bowlButton.disabled=false;

        bowlerRoot.add(ball);

        ball.position.set(
            .58,
            1.25,
            .35
        );

        ball.visible=false;

    }
);


/* ============================================================
   SCENE
============================================================ */

const scene=
    new THREE.Scene();

scene.background=
    new THREE.Color(
        0x071a2a
    );

scene.fog=
    new THREE.Fog(
        0x071a2a,
        30,
        105
    );


/* ============================================================
   CAMERA
============================================================ */

const camera=
    new THREE.PerspectiveCamera(
        46,
        innerWidth/innerHeight,
        .1,
        180
    );

camera.position.set(
    5.8,
    3.8,
    8.2
);

camera.lookAt(
    0,
    1.65,
    -5.8
);


/* ============================================================
   RENDERER
============================================================ */

const renderer=
    new THREE.WebGLRenderer({

        antialias:true,

        powerPreference:
            'high-performance'

    });

renderer.setSize(
    innerWidth,
    innerHeight
);

renderer.setPixelRatio(
    Math.min(
        devicePixelRatio,
        2
    )
);

renderer.shadowMap.enabled=true;

renderer.shadowMap.type=
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace=
    THREE.SRGBColorSpace;

renderer.toneMapping=
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure=
    1.1;

$('#game').append(
    renderer.domElement
);


/* ============================================================
   LIGHTING
============================================================ */

scene.add(
    new THREE.HemisphereLight(
        0xaedcff,
        0x173b23,
        2.1
    )
);


const sun=
    new THREE.DirectionalLight(
        0xffe6c4,
        3.6
    );

sun.position.set(
    -14,
    22,
    9
);

sun.castShadow=true;

sun.shadow.mapSize.set(
    2048,
    2048
);

sun.shadow.camera.left=-32;
sun.shadow.camera.right=32;
sun.shadow.camera.top=30;
sun.shadow.camera.bottom=-30;

scene.add(sun);


const fill=
    new THREE.DirectionalLight(
        0x7dbbff,
        1.5
    );

fill.position.set(
    14,
    10,
    2
);

scene.add(fill);


scene.add(
    new THREE.Mesh(
        new THREE.SphereGeometry(
            90,
            32,
            16
        ),
        new THREE.MeshBasicMaterial({
            color:0x081d34,
            side:THREE.BackSide
        })
    )
);


/* ============================================================
   MATERIAL
============================================================ */

const material=
    (c,r=.72)=>
        new THREE.MeshStandardMaterial({

            color:c,

            roughness:r

        });


/* ============================================================
   GRASS
============================================================ */

const grass=
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            120,
            120
        ),
        material(
            0x347d3a,
            1
        )
    );

grass.rotation.x=
    -Math.PI/2;

grass.receiveShadow=true;

scene.add(grass);


for(
    let x=-48;
    x<48;
    x+=8
){

    const s=
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                4,
                120
            ),
            material(
                x%16
                    ?0x398842
                    :0x317638,
                1
            )
        );

    s.rotation.x=
        -Math.PI/2;

    s.position.set(
        x,
        .006,
        0
    );

    scene.add(s);

}


/* ============================================================
   PITCH
============================================================ */

const pitch=
    new THREE.Mesh(
        new THREE.BoxGeometry(
            5.5,
            .12,
            39
        ),
        material(
            0xb18b59,
            1
        )
    );

pitch.position.set(
    0,
    .06,
    -3
);

pitch.receiveShadow=true;

scene.add(pitch);


for(
    let z=-21;
    z<16;
    z+=1.6
){

    const l=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5.3,
                .008,
                .018
            ),
            material(
                0x9b774d,
                1
            )
        );

    l.position.set(
        0,
        .13,
        z
    );

    scene.add(l);

}


/* ============================================================
   HELPER
============================================================ */

function part(
    p,
    g,
    m,
    x,
    y,
    z
){

    const o=
        new THREE.Mesh(
            g,
            m
        );

    o.position.set(
        x,
        y,
        z
    );

    o.castShadow=true;

    o.receiveShadow=true;

    p.add(o);

    return o;

}


/* ============================================================
   WICKET
============================================================ */

function wicket(z){

    const g=
        new THREE.Group();

    const w=
        material(
            0xf0e4bd,
            .5
        );

    const r=
        material(
            0xc62d2e,
            .5
        );


    [-.24,0,.24].forEach(
        x=>{

            part(
                g,
                new THREE.CylinderGeometry(
                    .045,
                    .05,
                    1.2,
                    12
                ),
                w,
                x,
                .72,
                0
            );

        }
    );


    [-.12,.12].forEach(
        x=>{

            const b=
                part(
                    g,
                    new THREE.CylinderGeometry(
                        .035,
                        .035,
                        .3,
                        10
                    ),
                    w,
                    x,
                    1.34,
                    0
                );

            b.rotation.z=
                Math.PI/2;

        }
    );


    part(
        g,
        new THREE.BoxGeometry(
            .62,
            .06,
            .08
        ),
        r,
        0,
        .2,
        0
    );


    g.position.z=z;

    scene.add(g);


    const c=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                .025,
                .1
            ),
            material(
                0xffffff,
                .6
            )
        );

    c.position.set(
        0,
        .16,
        z+(z>0?.55:-.55)
    );

    scene.add(c);

}


wicket(7.1);

wicket(-13.5);


/* ============================================================
   BOWLER / UMPIRE
============================================================ */

const bowlerRoot=
    new THREE.Group();

bowlerRoot.position.set(
    .2,
    0,
    -19
);

scene.add(bowlerRoot);


const umpireRoot=
    new THREE.Group();

umpireRoot.position.set(
    1.9,
    0,
    -15
);

scene.add(umpireRoot);


/* ============================================================
   BAT
============================================================ */

function createProfessionalCricketBat(
    batsmanModel
){

    let leftHand,
        rightHand;


    batsmanModel.updateMatrixWorld(
        true
    );


    batsmanModel.traverse(
        object=>{

            if(!object.isMesh)return;


            if(object.name==='GloveL')
                leftHand=object;

            if(object.name==='GloveR')
                rightHand=object;


            const name=
                object.name.toLowerCase();


            if(
                /bat|blade|handle|grip|cricket_pullshot/
                    .test(name)
            ){

                object.visible=false;

            }

        }
    );


    const handMidpoint=
        new THREE.Vector3(
            0,
            1.55,
            0
        );


    if(
        leftHand &&
        rightHand
    ){

        const left=
            new THREE.Box3()
                .setFromObject(leftHand)
                .getCenter(
                    new THREE.Vector3()
                );

        const right=
            new THREE.Box3()
                .setFromObject(rightHand)
                .getCenter(
                    new THREE.Vector3()
                );


        handMidpoint
            .copy(left)
            .add(right)
            .multiplyScalar(.5);


        batsmanModel.worldToLocal(
            handMidpoint
        );

    }


    const batPivot=
        new THREE.Group();

    batPivot.name=
        'BatHandPivot';

    batPivot.position.copy(
        handMidpoint
    );

    batsmanModel.add(
        batPivot
    );


    batPivot.rotation.z=
        THREE.MathUtils.degToRad(
            -27
        );


    const cricketBat=
        new THREE.Group();

    cricketBat.name=
        'CricketBat';

    batPivot.add(
        cricketBat
    );


    const wood=
        material(
            0xd99b55,
            .55
        );

    const edge=
        material(
            0xa86e36,
            .62
        );

    const handleWood=
        material(
            0x8b552f,
            .6
        );

    const grip=
        material(
            0x25282c,
            .88
        );

    const rings=
        material(
            0x111316,
            .9
        );


    part(
        cricketBat,
        new THREE.BoxGeometry(
            .48,
            1.65,
            .12
        ),
        wood,
        0,
        -.88,
        0
    ).name=
        'ProfessionalBatBlade';


    part(
        cricketBat,
        new THREE.BoxGeometry(
            .035,
            1.58,
            .135
        ),
        edge,
        -.245,
        -.86,
        0
    );


    part(
        cricketBat,
        new THREE.BoxGeometry(
            .035,
            1.58,
            .135
        ),
        edge,
        .245,
        -.86,
        0
    );


    part(
        cricketBat,
        new THREE.BoxGeometry(
            .43,
            .08,
            .14
        ),
        edge,
        0,
        -1.69,
        0
    );


    part(
        cricketBat,
        new THREE.CylinderGeometry(
            .06,
            .055,
            .72,
            20
        ),
        handleWood,
        0,
        .05,
        0
    );


    part(
        cricketBat,
        new THREE.CylinderGeometry(
            .072,
            .072,
            .42,
            20
        ),
        grip,
        0,
        .2,
        0
    );


    for(
        let index=0;
        index<7;
        index++
    ){

        const ring=
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    .075,
                    .009,
                    8,
                    20
                ),
                rings
            );

        ring.position.y=
            .02+
            index*.06;

        ring.castShadow=true;

        cricketBat.add(ring);

    }


    part(
        cricketBat,
        new THREE.SphereGeometry(
            .075,
            16,
            10
        ),
        handleWood,
        0,
        .42,
        0
    );


    batsmanModel.userData.cricketBat=
        batPivot;


    return batPivot;

}


/* ============================================================
   HUMAN PLACEMENT
============================================================ */

function placeHuman(
    model,
    anchor,
    position,
    height,
    rotationY=0
){

    model.position.set(
        0,
        0,
        0
    );

    model.rotation.set(
        0,
        0,
        0
    );

    model.scale.set(
        1,
        1,
        1
    );


    const box=
        new THREE.Box3()
            .setFromObject(model);

    const size=
        box.getSize(
            new THREE.Vector3()
        );


    model.scale.setScalar(
        height/size.y
    );


    const scaled=
        new THREE.Box3()
            .setFromObject(model);

    const center=
        scaled.getCenter(
            new THREE.Vector3()
        );


    model.position.set(
        position.x-center.x,
        position.y-scaled.min.y,
        position.z-center.z
    );


    model.rotation.y=
        rotationY;


    anchor.add(model);


    model.traverse(
        o=>{

            if(o.isMesh){

                o.castShadow=true;

                o.receiveShadow=true;

            }

        }
    );


    if(
        anchor===scene &&
        height===3.2
    ){

        createProfessionalCricketBat(
            model
        );

    }

}


/* ============================================================
   PLAYER LOADING
============================================================ */

let batsman,
    mixer,
    actions=[],
    batsmanBat,
    bowlerMixer,
    bowlerActions=[];

let loadedPlayers=0;


const playerFiles=[

    [
        'models/batsman.glb',
        scene,
        {
            x:-1.45,
            y:0,
            z:2.05
        },
        3.2,
        Math.PI,
        'batsman'
    ],

    [
        'models/bowler.glb',
        bowlerRoot,
        {
            x:0,
            y:0,
            z:0
        },
        3.1,
        Math.PI,
        'bowler'
    ],

    [
        'models/umpire.glb',
        umpireRoot,
        {
            x:0,
            y:0,
            z:0
        },
        2.6,
        Math.PI,
        'umpire'
    ]

];


playerFiles.forEach(
    ([
        file,
        anchor,
        position,
        height,
        rotation,
        name
    ])=>{

        new GLTFLoader().load(

            file,

            g=>{

                const model=
                    g.scene;


                placeHuman(
                    model,
                    anchor,
                    position,
                    height,
                    rotation
                );


                if(name==='batsman'){

                    batsman=model;

                    mixer=
                        new THREE.AnimationMixer(
                            model
                        );


                    const shotClips=
                        g.animations.filter(
                            a=>
                                /bat|swing|shot|hit/i
                                    .test(a.name)
                        );


                    actions=
                        (
                            shotClips.length
                            ?
                            shotClips
                            :
                            g.animations
                        ).map(
                            a=>
                                mixer.clipAction(a)
                        );

                }


                if(
                    name==='bowler' &&
                    g.animations.length
                ){

                    bowlerMixer=
                        new THREE.AnimationMixer(
                            model
                        );


                    bowlerActions=
                        g.animations
                            .filter(
                                a=>
                                    /bowl|run|throw|delivery/i
                                        .test(a.name)
                            )
                            .map(
                                a=>
                                    bowlerMixer.clipAction(a)
                            );

                }


                loadedPlayers++;


                if(
                    loadedPlayers===
                    playerFiles.length
                ){

                    loadingEl.remove();

                    bowlButton.disabled=false;

                }

            },

            undefined,

            e=>{

                console.error(
                    `Could not load ${file}`,
                    e
                );

                loadingEl.textContent=
                    `Could not load ${name}.glb`;

                errorEl.textContent=
                    `Could not load ${name}.glb`;

                errorEl.style.display=
                    'block';

                bowlButton.disabled=false;

            }

        );

    }
);


/* ============================================================
   BALL
============================================================ */

const ball=
    new THREE.Group();

ball.name=
    'DeliveryBall';


part(
    ball,
    new THREE.SphereGeometry(
        .16,
        20,
        14
    ),
    material(
        0xb71924,
        .38
    ),
    0,
    0,
    0
);


const seam=
    new THREE.Mesh(
        new THREE.TorusGeometry(
            .162,
            .009,
            6,
            30
        ),
        material(
            0xffffff,
            .35
        )
    );


seam.rotation.x=
    Math.PI/2;

ball.add(seam);

ball.visible=false;

ball.position.set(
    .58,
    1.25,
    .35
);

bowlerRoot.add(ball);

bowlerRoot.userData.deliveryBall=
    ball;


const ballTarget=
    new THREE.Vector3(
        -.8,
        1.38,
        2.3
    );


const releasePosition=
    new THREE.Vector3();

const flightStart=
    new THREE.Vector3();


/* ============================================================
   BAT SWING
============================================================ */

function swing(){

    if(
        !batsmanBat ||
        !batsmanBat.visible
    ){

        return;

    }


    const startZ=
        batsmanBat.rotation.z;

    const startX=
        batsmanBat.rotation.x;

    const startY=
        batsmanBat.rotation.y;


    const angle=
        state.shotGesture===6
        ?1.9
        :
        state.shotGesture===4
        ?1.05
        :
        1.35;


    const twist=
        state.shotGesture===6
        ?.34
        :
        state.shotGesture===4
        ?-.22
        :
        .2;


    const t0=
        performance.now();


    const f=
        n=>{

            const t=
                Math.min(
                    (n-t0)/620,
                    1
                );


            const e=
                Math.sin(
                    t*Math.PI
                );


            const follow=
                Math.sin(
                    t*Math.PI*2
                );


            batsmanBat.rotation.z=
                startZ-e*angle;

            batsmanBat.rotation.x=
                startX+
                e*(
                    state.shotGesture===6
                    ?.35
                    :
                    .2
                );

            batsmanBat.rotation.y=
                startY+
                follow*twist;


            if(t<1){

                requestAnimationFrame(f);

            }else{

                batsmanBat.rotation.set(
                    startX,
                    startY,
                    startZ
                );

            }

        };


    requestAnimationFrame(f);

}


/* ============================================================
   START BOWLING
============================================================ */

function start(){

    if(
        state.phase!=='ready'
    ){

        return;

    }


    state.phase='run';

    state.time=0;

    state.shotTriggered=false;

    state.ballReleased=false;

    // IMPORTANT:
    // Every new delivery starts with NO gesture.
    state.shotGesture=0;

    state.handDetected=false;

    state.lastHandSeen=0;

    messageEl.textContent=
        'Bowler is running in...';

    bowlButton.disabled=true;


    bowlerActions.forEach(
        action=>
            action
                .reset()
                .play()
    );


    batsmanBat=
        batsman?.userData.cricketBat
        ||
        batsmanBat;


    if(
        batsmanBat &&
        batsmanBat.visible
    ){

        batsmanBat.getWorldPosition(
            ballTarget
        );

    }


    bowlerRoot.userData.deliveryBall=
        ball;

    bowlerRoot.add(ball);


    ball.position.set(
        .58,
        1.25,
        .35
    );

    bowlerRoot.localToWorld(
        releasePosition.copy(
            ball.position
        )
    );

    ball.visible=true;

}


bowlButton.addEventListener(
    'click',
    start
);


/* ============================================================
   FINISH BALL
============================================================ */

function finish(){

    /* --------------------------------------------------------
       REAL OUT
    -------------------------------------------------------- */

    if(state.out){

        state.out=false;

        // CHANGE 2:
        // Wicket +1
        state.wickets++;

        // CHANGE 2:
        // Score becomes ZERO
        state.score=0;

        scoreEl.textContent=
            state.score;

        wicketEl.textContent=
            state.wickets;

        messageEl.textContent=
            'OUT! SCORE RESET TO 0';

        state.ball++;

        ballEl.textContent=
            `${Math.min(
                state.ball,
                6
            )}/6`;


        setTimeout(
            ()=>{

                if(
                    state.ball>6
                ){

                    messageEl.textContent=
                        'OVER COMPLETED! GOOD TRY!';

                    announceOverComplete();

                    state.phase=
                        'complete';

                }else{

                    state.phase=
                        'ready';

                    messageEl.textContent=
                        'Ready for next ball';

                    bowlButton.disabled=false;

                }

            },
            950
        );

        return;

    }


    /* --------------------------------------------------------
       CHECK HAND GESTURE
    -------------------------------------------------------- */

    const validGesture=
        [1,2,4,6].includes(
            state.shotGesture
        );


    /* --------------------------------------------------------
       CHANGE 3:
       NO HAND GESTURE = DOT BALL + WICKET
    -------------------------------------------------------- */

    if(!validGesture){

        state.wickets++;

        state.score=0;

        scoreEl.textContent=
            state.score;

        wicketEl.textContent=
            state.wickets;

        messageEl.textContent=
            'DOT BALL — WICKET! SCORE RESET TO 0';

    }


    /* --------------------------------------------------------
       NORMAL RUN
    -------------------------------------------------------- */

    else{

        const runs=
            state.shotGesture;

        state.score+=runs;

        scoreEl.textContent=
            state.score;

        messageEl.textContent=
            runs===6
            ?
            'SIX!'
            :
            runs===4
            ?
            'FOUR!'
            :
            `${runs} RUN!`;

    }


    state.ball++;


    // Show the updated ball count.
    ballEl.textContent=
        `${Math.min(
            state.ball,
            6
        )}/6`;


    setTimeout(
        ()=>{

            if(
                state.ball>6
            ){

                messageEl.textContent=
                    'OVER COMPLETED! GOOD TRY!';

                announceOverComplete();

                state.phase=
                    'complete';

            }else{

                state.phase=
                    'ready';

                messageEl.textContent=
                    'Ready for next ball';

                bowlButton.disabled=false;

            }

        },
        950
    );

}


/* ============================================================
   GAME LOOP
============================================================ */

const clock=
    new THREE.Clock();


function loop(){

    requestAnimationFrame(
        loop
    );


    const dt=
        clock.getDelta();


    if(mixer)
        mixer.update(dt);


    if(bowlerMixer)
        bowlerMixer.update(dt);


    if(
        state.phase==='run'
    ){

        state.time+=dt;


        const t=
            state.time;


        const run=
            Math.min(
                t/2.3,
                1
            );


        bowlerRoot.position.z=
            -19+
            run*5.4;


        bowlerRoot.position.y=
            Math.abs(
                Math.sin(t*9)
            )*.035;


        /* ====================================================
           BALL RELEASE
        ==================================================== */

        if(
            t>1.7 &&
            !state.ballReleased
        ){

            state.ballReleased=true;


            ball.getWorldPosition(
                releasePosition
            );


            flightStart.copy(
                releasePosition
            );


            scene.attach(
                ball
            );


            ball.position.copy(
                releasePosition
            );


            messageEl.textContent=
                'BOWLER DELIVERS!';

        }


        if(
            t>1.8
        ){

            messageEl.textContent=
                'BOWLER DELIVERS!';

        }


        /* ====================================================
           BALL FLIGHT
        ==================================================== */

        const f=
            Math.min(
                Math.max(
                    (t-1.7)/.78,
                    0
                ),
                1
            );


        if(f){

            ball.position.set(

                flightStart.x+
                    f*(
                        ballTarget.x-
                        flightStart.x
                    ),

                flightStart.y+
                    f*(
                        ballTarget.y-
                        flightStart.y
                    )+
                    Math.sin(
                        f*Math.PI
                    )*.16,

                flightStart.z+
                    f*(
                        ballTarget.z-
                        flightStart.z
                    )

            );


            ball.rotation.x+=
                dt*14;


            /* =================================================
               SHOT / GESTURE CHECK
            ================================================= */

            if(
                f>.76 &&
                !state.shotTriggered
            ){

                state.shotTriggered=true;


                const gestureIsValid=
                    [1,2,4,6].includes(
                        state.shotGesture
                    );


                if(
                    gestureIsValid
                ){

                    swing();

                }else{

                    /*
                       No gesture.

                       DO NOT add the wicket here.

                       finish() will add exactly ONE
                       wicket and reset the score to 0.
                    */

                    messageEl.textContent=
                        'NO HAND GESTURE';

                }

            }

        }


        /* ====================================================
           END OF BALL
        ==================================================== */

        if(
            t>2.48
        ){

            ball.visible=false;

            state.phase=
                'result';

            finish();

        }

    }


    /* ========================================================
       SCOREBOARD
    ======================================================== */

    scoreEl.textContent=
        state.score;

    wicketEl.textContent=
        state.wickets;

    // CHANGE 1:
    // This now correctly starts at 0/6.
    ballEl.textContent=
        `${Math.min(
            state.ball,
            6
        )}/6`;


    /* ========================================================
       RENDER
    ======================================================== */

    renderer.render(
        scene,
        camera
    );

}


loop();


/* ============================================================
   RESIZE
============================================================ */

addEventListener(
    'resize',
    ()=>{

        camera.aspect=
            innerWidth/
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );

    }
);