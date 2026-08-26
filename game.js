import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


/* =========================================================
   HAND CRICKET AI - GESTURE VERSION
   1 = 1 RUN
   2 = 2 RUNS
   4 = FOUR
   6 = SIX
   NO GESTURE = WICKET
========================================================= */


/* =========================================================
   DOM
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const scoreEl =
    $('#score');

const wicketEl =
    $('#wicket');

const ballEl =
    $('#ballNumber');

const messageEl =
    $('#message');

const bowlButton =
    $('#bowlButton');

const playAgainButton =
    $('#playAgainButton');

const loadingEl =
    $('#loading');

const errorEl =
    $('#error');


/* =========================================================
   GAME STATE
========================================================= */

const state = {

    score: 0,

    wickets: 0,

    ball: 1,

    totalBalls: 6,

    phase: 'ready',

    time: 0,

    shotTriggered: false,

    ballReleased: false,

    currentRuns: 0,

    /*
       IMPORTANT:
       This is now controlled by the camera.
       It is NOT randomly selected.
    */
    shotGesture: 0,

    cameraReady: false,

    handDetected: false,

    lastHandSeen: 0,

    out: false

};


/* =========================================================
   CAMERA GESTURE EVENT
========================================================= */

window.addEventListener(
    'cricket:camera-gesture',
    (event) => {

        if (
            state.phase !== 'run'
        ) {
            return;
        }

        const gesture =
            Number(event.detail?.gesture);

        if (
            [1, 2, 4, 6].includes(gesture)
        ) {

            state.shotGesture =
                gesture;

            state.handDetected =
                true;

            state.lastHandSeen =
                performance.now();

            console.log(
                '🏏 GESTURE DETECTED:',
                gesture
            );

            messageEl.textContent =
                `Gesture ${gesture} detected`;

        }

    }
);


/* =========================================================
   CAMERA PRESENCE
========================================================= */

window.addEventListener(
    'cricket:camera-presence',
    (event) => {

        state.cameraReady =
            event.detail?.available === true;

        if (
            event.detail?.detected
        ) {

            state.handDetected =
                true;

            state.lastHandSeen =
                performance.now();

        }

    }
);


/* =========================================================
   WICKET EVENT
========================================================= */

window.addEventListener(
    'cricket:wicket',
    () => {

        state.score = 0;

        state.wickets++;

        state.out = true;

        messageEl.textContent =
            'OUT! ❌';

        messageEl.classList.add(
            'out-message'
        );

        scoreEl.textContent =
            state.score;

        wicketEl.textContent =
            state.wickets;

    }
);


/* =========================================================
   PLAY AGAIN
========================================================= */

playAgainButton.addEventListener(
    'click',
    () => {

        state.score = 0;

        state.wickets = 0;

        state.ball = 1;

        state.phase = 'ready';

        state.time = 0;

        state.shotTriggered = false;

        state.ballReleased = false;

        state.out = false;

        state.shotGesture = 0;

        state.handDetected = false;

        state.lastHandSeen = 0;

        scoreEl.textContent =
            '0';

        wicketEl.textContent =
            '0';

        ballEl.textContent =
            '1/6';

        messageEl.textContent =
            'Ready for next ball';

        messageEl.classList.remove(
            'out-message'
        );

        playAgainButton.style.display =
            'none';

        bowlButton.disabled =
            false;

        bowlerRoot.add(ball);

        ball.position.set(
            .58,
            1.25,
            .35
        );

        ball.visible =
            false;

    }
);


/* =========================================================
   THREE.JS SCENE
========================================================= */

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(
        0x071a2a
    );

scene.fog =
    new THREE.Fog(
        0x071a2a,
        30,
        105
    );


/* =========================================================
   CAMERA
========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        46,
        innerWidth / innerHeight,
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


/* =========================================================
   RENDERER
========================================================= */

const renderer =
    new THREE.WebGLRenderer({
        antialias: true,
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

renderer.shadowMap.enabled =
    true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
    1.1;

$('#game').append(
    renderer.domElement
);


/* =========================================================
   LIGHTING
========================================================= */

scene.add(
    new THREE.HemisphereLight(
        0xaedcff,
        0x173b23,
        2.1
    )
);

const sun =
    new THREE.DirectionalLight(
        0xffe6c4,
        3.6
    );

sun.position.set(
    -14,
    22,
    9
);

sun.castShadow =
    true;

sun.shadow.mapSize.set(
    2048,
    2048
);

sun.shadow.camera.left =
    -32;

sun.shadow.camera.right =
    32;

sun.shadow.camera.top =
    30;

sun.shadow.camera.bottom =
    -30;

scene.add(
    sun
);


const fill =
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
            color: 0x081d34,
            side: THREE.BackSide
        })
    )
);


/* =========================================================
   MATERIAL
========================================================= */

const material =
    (
        color,
        roughness = .72
    ) =>
        new THREE.MeshStandardMaterial({
            color,
            roughness
        });


/* =========================================================
   GRASS
========================================================= */

const grass =
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

grass.rotation.x =
    -Math.PI / 2;

grass.receiveShadow =
    true;

scene.add(
    grass
);


/* =========================================================
   GRASS STRIPES
========================================================= */

for (
    let x = -48;
    x < 48;
    x += 8
) {

    const stripe =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                4,
                120
            ),
            material(
                x % 16
                    ? 0x398842
                    : 0x317638,
                1
            )
        );

    stripe.rotation.x =
        -Math.PI / 2;

    stripe.position.set(
        x,
        .006,
        0
    );

    scene.add(
        stripe
    );

}


/* =========================================================
   PITCH
========================================================= */

const pitch =
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

pitch.receiveShadow =
    true;

scene.add(
    pitch
);


/* =========================================================
   PITCH MARKINGS
========================================================= */

for (
    let z = -21;
    z < 16;
    z += 1.6
) {

    const line =
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

    line.position.set(
        0,
        .13,
        z
    );

    scene.add(
        line
    );

}


/* =========================================================
   HELPER
========================================================= */

function part(
    parent,
    geometry,
    mat,
    x,
    y,
    z
) {

    const object =
        new THREE.Mesh(
            geometry,
            mat
        );

    object.position.set(
        x,
        y,
        z
    );

    object.castShadow =
        true;

    object.receiveShadow =
        true;

    parent.add(
        object
    );

    return object;

}


/* =========================================================
   WICKET
========================================================= */

function wicket(z) {

    const group =
        new THREE.Group();

    const wood =
        material(
            0xf0e4bd,
            .5
        );

    const red =
        material(
            0xc62d2e,
            .5
        );


    [-.24, 0, .24].forEach(
        (x) => {

            part(
                group,
                new THREE.CylinderGeometry(
                    .045,
                    .05,
                    1.2,
                    12
                ),
                wood,
                x,
                .72,
                0
            );

        }
    );


    [-.12, .12].forEach(
        (x) => {

            const bail =
                part(
                    group,
                    new THREE.CylinderGeometry(
                        .035,
                        .035,
                        .3,
                        10
                    ),
                    wood,
                    x,
                    1.34,
                    0
                );

            bail.rotation.z =
                Math.PI / 2;

        }
    );


    part(
        group,
        new THREE.BoxGeometry(
            .62,
            .06,
            .08
        ),
        red,
        0,
        .2,
        0
    );


    group.position.z =
        z;

    scene.add(
        group
    );


    const crease =
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

    crease.position.set(
        0,
        .16,
        z +
            (
                z > 0
                    ? .55
                    : -.55
            )
    );

    scene.add(
        crease
    );

}


wicket(7.1);

wicket(-13.5);


/* =========================================================
   BOWLER
========================================================= */

const bowlerRoot =
    new THREE.Group();

bowlerRoot.position.set(
    .2,
    0,
    -19
);

scene.add(
    bowlerRoot
);


/* =========================================================
   UMPIRE
========================================================= */

const umpireRoot =
    new THREE.Group();

umpireRoot.position.set(
    1.9,
    0,
    -15
);

scene.add(
    umpireRoot
);


/* =========================================================
   CRICKET BAT
========================================================= */

function createProfessionalCricketBat(
    batsmanModel
) {

    let leftHand;

    let rightHand;


    batsmanModel.updateMatrixWorld(
        true
    );


    batsmanModel.traverse(
        (object) => {

            if (
                !object.isMesh
            ) {
                return;
            }


            if (
                object.name ===
                'GloveL'
            ) {
                leftHand =
                    object;
            }


            if (
                object.name ===
                'GloveR'
            ) {
                rightHand =
                    object;
            }


            const name =
                object.name.toLowerCase();


            if (
                /bat|blade|handle|grip|cricket_pullshot/
                    .test(name)
            ) {

                object.visible =
                    false;

            }

        }
    );


    const handMidpoint =
        new THREE.Vector3(
            0,
            1.55,
            0
        );


    if (
        leftHand &&
        rightHand
    ) {

        const left =
            new THREE.Box3()
                .setFromObject(
                    leftHand
                )
                .getCenter(
                    new THREE.Vector3()
                );


        const right =
            new THREE.Box3()
                .setFromObject(
                    rightHand
                )
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


    const batPivot =
        new THREE.Group();

    batPivot.name =
        'BatHandPivot';

    batPivot.position.copy(
        handMidpoint
    );

    batsmanModel.add(
        batPivot
    );


    batPivot.rotation.z =
        THREE.MathUtils.degToRad(
            -27
        );


    const cricketBat =
        new THREE.Group();

    cricketBat.name =
        'CricketBat';

    batPivot.add(
        cricketBat
    );


    const wood =
        material(
            0xd99b55,
            .55
        );

    const edge =
        material(
            0xa86e36,
            .62
        );

    const handleWood =
        material(
            0x8b552f,
            .6
        );

    const grip =
        material(
            0x25282c,
            .88
        );

    const rings =
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
    ).name =
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


    for (
        let index = 0;
        index < 7;
        index++
    ) {

        const ring =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    .075,
                    .009,
                    8,
                    20
                ),
                rings
            );

        ring.position.y =
            .02 +
            index * .06;

        ring.castShadow =
            true;

        cricketBat.add(
            ring
        );

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


    batsmanModel.userData.cricketBat =
        batPivot;


    return batPivot;

}


/* =========================================================
   HUMAN PLACEMENT
========================================================= */

function placeHuman(
    model,
    anchor,
    position,
    height,
    rotationY = 0
) {

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


    const box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    model.scale.setScalar(
        height / size.y
    );


    const scaled =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const center =
        scaled.getCenter(
            new THREE.Vector3()
        );


    model.position.set(
        position.x - center.x,
        position.y - scaled.min.y,
        position.z - center.z
    );


    model.rotation.y =
        rotationY;


    anchor.add(
        model
    );


    model.traverse(
        (object) => {

            if (
                object.isMesh
            ) {

                object.castShadow =
                    true;

                object.receiveShadow =
                    true;

            }

        }
    );


    if (
        anchor === scene &&
        height === 3.2
    ) {

        createProfessionalCricketBat(
            model
        );

    }

}


/* =========================================================
   PLAYER MODELS
========================================================= */

let batsman;

let mixer;

let actions = [];

let batsmanBat;

let bowlerMixer;

let bowlerActions = [];

let loadedPlayers = 0;


const playerFiles = [

    [
        'models/batsman.glb',
        scene,
        {
            x: -1.45,
            y: 0,
            z: 2.05
        },
        3.2,
        Math.PI,
        'batsman'
    ],

    [
        'models/bowler.glb',
        bowlerRoot,
        {
            x: 0,
            y: 0,
            z: 0
        },
        3.1,
        Math.PI,
        'bowler'
    ],

    [
        'models/umpire.glb',
        umpireRoot,
        {
            x: 0,
            y: 0,
            z: 0
        },
        2.6,
        Math.PI,
        'umpire'
    ]

];


/* =========================================================
   LOAD PLAYERS
========================================================= */

playerFiles.forEach(
    (
        [
            file,
            anchor,
            position,
            height,
            rotation,
            name
        ]
    ) => {

        new GLTFLoader().load(

            file,

            (gltf) => {

                const model =
                    gltf.scene;


                placeHuman(
                    model,
                    anchor,
                    position,
                    height,
                    rotation
                );


                if (
                    name === 'batsman'
                ) {

                    batsman =
                        model;


                    mixer =
                        new THREE.AnimationMixer(
                            model
                        );


                    const shotClips =
                        gltf.animations.filter(
                            animation =>
                                /bat|swing|shot|hit/i
                                    .test(
                                        animation.name
                                    )
                        );


                    actions =
                        (
                            shotClips.length
                                ? shotClips
                                : gltf.animations
                        ).map(
                            animation =>
                                mixer.clipAction(
                                    animation
                                )
                        );


                    batsmanBat =
                        model.userData.cricketBat;

                }


                if (
                    name === 'bowler' &&
                    gltf.animations.length
                ) {

                    bowlerMixer =
                        new THREE.AnimationMixer(
                            model
                        );


                    bowlerActions =
                        gltf.animations
                            .filter(
                                animation =>
                                    /bowl|run|throw|delivery/i
                                        .test(
                                            animation.name
                                        )
                            )
                            .map(
                                animation =>
                                    bowlerMixer
                                        .clipAction(
                                            animation
                                        )
                            );

                }


                loadedPlayers++;


                if (
                    loadedPlayers ===
                    playerFiles.length
                ) {

                    if (
                        loadingEl
                    ) {

                        loadingEl.remove();

                    }

                    bowlButton.disabled =
                        false;

                }

            },

            undefined,

            (error) => {

                console.error(
                    `Could not load ${file}`,
                    error
                );


                if (
                    loadingEl
                ) {

                    loadingEl.textContent =
                        `Could not load ${name}.glb`;

                }


                if (
                    errorEl
                ) {

                    errorEl.textContent =
                        `Could not load ${name}.glb`;

                    errorEl.style.display =
                        'block';

                }


                bowlButton.disabled =
                    false;

            }

        );

    }
);


/* =========================================================
   BALL
========================================================= */

const ball =
    new THREE.Group();

ball.name =
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


const seam =
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

seam.rotation.x =
    Math.PI / 2;

ball.add(
    seam
);


ball.visible =
    false;


ball.position.set(
    .58,
    1.25,
    .35
);


bowlerRoot.add(
    ball
);


bowlerRoot.userData.deliveryBall =
    ball;


const ballTarget =
    new THREE.Vector3(
        -.8,
        1.38,
        2.3
    );


const releasePosition =
    new THREE.Vector3();


const flightStart =
    new THREE.Vector3();


/* =========================================================
   BAT SWING
========================================================= */

function swing() {

    if (
        !batsmanBat
    ) {

        console.warn(
            'No cricket bat found'
        );

        return;

    }


    const startZ =
        batsmanBat.rotation.z;

    const startX =
        batsmanBat.rotation.x;

    const startY =
        batsmanBat.rotation.y;


    let angle;

    let twist;


    switch (
        state.shotGesture
    ) {

        case 6:

            angle =
                1.9;

            twist =
                .34;

            break;


        case 4:

            angle =
                1.05;

            twist =
                -.22;

            break;


        case 2:

            angle =
                1.35;

            twist =
                .12;

            break;


        case 1:

            angle =
                1.25;

            twist =
                .2;

            break;


        default:

            angle =
                1.2;

            twist =
                .1;

    }


    const startTime =
        performance.now();


    const animateSwing =
        (now) => {

            const t =
                Math.min(
                    (now - startTime) /
                    620,
                    1
                );


            const easing =
                Math.sin(
                    t * Math.PI
                );


            const follow =
                Math.sin(
                    t * Math.PI * 2
                );


            batsmanBat.rotation.z =
                startZ -
                easing * angle;


            batsmanBat.rotation.x =
                startX +
                easing *
                (
                    state.shotGesture === 6
                        ? .35
                        : .2
                );


            batsmanBat.rotation.y =
                startY +
                follow * twist;


            if (
                t < 1
            ) {

                requestAnimationFrame(
                    animateSwing
                );

            }
            else {

                batsmanBat.rotation.set(
                    startX,
                    startY,
                    startZ
                );

            }

        };


    requestAnimationFrame(
        animateSwing
    );

}


/* =========================================================
   START BOWLING
========================================================= */

function start() {

    if (
        state.phase !== 'ready'
    ) {

        return;

    }


    state.phase =
        'run';


    state.time =
        0;


    state.shotTriggered =
        false;


    state.ballReleased =
        false;


    /*
       IMPORTANT:
       Do NOT randomly choose 1/2/4/6.

       Wait for the camera.
    */

    state.shotGesture =
        0;


    state.handDetected =
        false;


    state.lastHandSeen =
        0;


    state.out =
        false;


    messageEl.textContent =
        '🏏 Watch the ball and make your gesture!';


    bowlButton.disabled =
        true;


    bowlerActions.forEach(
        action => {

            action.reset();

            action.play();

        }
    );


    batsmanBat =
        batsman?.userData.cricketBat ||
        batsmanBat;


    if (
        batsmanBat
    ) {

        batsmanBat.getWorldPosition(
            ballTarget
        );

    }


    bowlerRoot.userData.deliveryBall =
        ball;


    bowlerRoot.add(
        ball
    );


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


    ball.visible =
        true;

}


/* =========================================================
   BUTTON
========================================================= */

bowlButton.addEventListener(
    'click',
    start
);


/* =========================================================
   GAME RESULT
========================================================= */

function finish() {

    /*
       WICKET
    */

    if (
        state.out
    ) {

        state.out =
            false;

        state.ball++;


        setTimeout(
            () => {

                if (
                    state.ball > 6
                ) {

                    messageEl.textContent =
                        '🏁 OVER COMPLETE!';

                    state.phase =
                        'complete';

                    playAgainButton.style.display =
                        'block';

                }
                else {

                    state.phase =
                        'ready';

                    messageEl.textContent =
                        'Ready for next ball';

                    bowlButton.disabled =
                        false;

                }

            },
            950
        );


        return;

    }


    /*
       RUNS
    */

    const runs =
        state.shotGesture;


    /*
       Safety check.
       A valid shot must be 1, 2, 4 or 6.
    */

    if (
        ![1, 2, 4, 6].includes(
            runs
        )
    ) {

        state.out =
            true;

        window.dispatchEvent(
            new CustomEvent(
                'cricket:wicket'
            )
        );

        finish();

        return;

    }


    state.score +=
        runs;


    if (
        runs === 6
    ) {

        messageEl.textContent =
            '🏏 SIX!';

    }
    else if (
        runs === 4
    ) {

        messageEl.textContent =
            '🏏 FOUR!';

    }
    else {

        messageEl.textContent =
            `🏃 ${runs} RUN${runs > 1 ? 'S' : ''}!`;

    }


    state.ball++;


    setTimeout(
        () => {

            if (
                state.ball > 6
            ) {

                messageEl.textContent =
                    '🏁 OVER COMPLETE!';

                state.phase =
                    'complete';

                playAgainButton.style.display =
                    'block';

            }
            else {

                state.phase =
                    'ready';

                messageEl.textContent =
                    'Ready for next ball';

                bowlButton.disabled =
                    false;

            }

        },
        950
    );

}


/* =========================================================
   MAIN GAME LOOP
========================================================= */

const clock =
    new THREE.Clock();


function loop() {

    requestAnimationFrame(
        loop
    );


    const dt =
        clock.getDelta();


    if (
        mixer
    ) {

        mixer.update(
            dt
        );

    }


    if (
        bowlerMixer
    ) {

        bowlerMixer.update(
            dt
        );

    }


    /* =====================================================
       BALL / BOWLING
    ===================================================== */

    if (
        state.phase === 'run'
    ) {

        state.time +=
            dt;


        const t =
            state.time;


        const run =
            Math.min(
                t / 2.3,
                1
            );


        bowlerRoot.position.z =
            -19 +
            run * 5.4;


        bowlerRoot.position.y =
            Math.abs(
                Math.sin(
                    t * 9
                )
            ) * .035;


        /* =================================================
           RELEASE BALL
        ================================================= */

        if (
            t > 1.7 &&
            !state.ballReleased
        ) {

            state.ballReleased =
                true;


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


            messageEl.textContent =
                '🏏 BOWLER DELIVERS!';

        }


        if (
            t > 1.8
        ) {

            /*
               Don't overwrite the gesture message
               once the camera has detected a gesture.
            */

            if (
                !state.handDetected
            ) {

                messageEl.textContent =
                    '🏏 BOWLER DELIVERS!';

            }

        }


        /* =================================================
           BALL FLIGHT
        ================================================= */

        const f =
            Math.min(
                Math.max(
                    (t - 1.7) / .78,
                    0
                ),
                1
            );


        if (
            f
        ) {

            ball.position.set(

                flightStart.x +
                f *
                (
                    ballTarget.x -
                    flightStart.x
                ),

                flightStart.y +
                f *
                (
                    ballTarget.y -
                    flightStart.y
                ) +
                Math.sin(
                    f * Math.PI
                ) * .16,

                flightStart.z +
                f *
                (
                    ballTarget.z -
                    flightStart.z
                )

            );


            ball.rotation.x +=
                dt * 14;


            /* =================================================
               SHOT DECISION
            ================================================= */

            if (
                f > .76 &&
                !state.shotTriggered
            ) {

                state.shotTriggered =
                    true;


                const gestureIsValid =
                    state.handDetected &&
                    [1, 2, 4, 6].includes(
                        state.shotGesture
                    );


                /*
                   VALID GESTURE
                */

                if (
                    gestureIsValid
                ) {

                    console.log(
                        '🏏 PLAYING SHOT:',
                        state.shotGesture
                    );


                    messageEl.textContent =
                        `🏏 ${state.shotGesture} gesture!`;


                    swing();

                }


                /*
                   NO VALID GESTURE
                */

                else {

                    console.log(
                        '❌ NO VALID GESTURE - WICKET'
                    );


                    state.out =
                        true;


                    window.dispatchEvent(
                        new CustomEvent(
                            'cricket:wicket'
                        )
                    );

                }

            }

        }


        /* =================================================
           BALL FINISHED
        ================================================= */

        if (
            t > 2.48
        ) {

            ball.visible =
                false;


            state.phase =
                'result';


            finish();

        }

    }


    /* =====================================================
       UI
    ===================================================== */

    scoreEl.textContent =
        state.score;


    wicketEl.textContent =
        state.wickets;


    ballEl.textContent =
        `${Math.min(
            state.ball,
            6
        )}/6`;


    /* =====================================================
       RENDER
    ===================================================== */

    renderer.render(
        scene,
        camera
    );

}


loop();


/* =========================================================
   OVER COMPLETE MESSAGE
========================================================= */

setInterval(
    () => {

        if (
            typeof state !== 'undefined' &&
            state.phase === 'complete'
        ) {

            messageEl.textContent =
                '🏁 OVER COMPLETED! GOOD TRY!';

            playAgainButton.style.display =
                'block';

        }

    },
    100
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

addEventListener(
    'resize',
    () => {

        camera.aspect =
            innerWidth /
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );

    }
);