import { CopyShader } from 'three/examples/jsm/shaders/CopyShader'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutlinePassLine } from '../lib/modified-three/OutlinePassLine.js'
import { OutlinePassFill } from '../lib/modified-three/OutlinePassFill.js'

import {
    CylinderGeometry,
    CircleGeometry,
    Vector2,
    NormalBlending,
    WebGLRenderer,
    Vector3,
    Mesh,
    DoubleSide,
    MeshBasicMaterial,
    TextureLoader,
    Object3D,
    SphereGeometry,
    LineBasicMaterial,
    BufferGeometry,
    Line,
    Texture,
} from 'three'
import { raycaster, rotating, translating } from './controls'
import _ from 'lodash'
import { mouse, onSceneMouseDown } from './input'
import { scene } from './util'
import { camera, insideCamera } from './camera'
import { properties } from './properties'
import { timelineCanvas, timelineContext, timelineLabels } from './timeline'

export let timelineHeight = 0.25
export let width = window.innerWidth
export let height = window.innerHeight * (1 - timelineHeight)

export const renderer = new WebGLRenderer()
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

export const textureLoader = new TextureLoader()

export let lineGeometry = new CylinderGeometry(0.005, 0.005, 2.3, 64)
export let lineGeometryClick = new CylinderGeometry(0.05, 0.05, 2.3, 64)
export let arrowGeometry = new CylinderGeometry(0, 0.03, 0.06, 64)

export let circleGeometry = new CircleGeometry(1, 64)

export let renderPass: RenderPass
export let copyPass = new ShaderPass(CopyShader)
copyPass.renderToScreen = true

export let selectedOutlinePassLine: OutlinePassLine

export let xRotateOutline: OutlinePassLine
export let yRotateOutline: OutlinePassLine
export let zRotateOutline: OutlinePassLine
export let xTranslateOutline: OutlinePassFill
export let yTranslateOutline: OutlinePassFill
export let zTranslateOutline: OutlinePassFill

export let composer: EffectComposer

export function createTransparentMaterial(map: Texture) {
    return new MeshBasicMaterial({
        color: 0xffffff,
        map: map,
        transparent: false,
        alphaTest: 0.5,
        depthWrite: true,
        depthTest: true,
        side: DoubleSide,
    })
}

export const transparentTexture = new TextureLoader().load('images/transparent.png')
export const transparentMaterial = createTransparentMaterial(transparentTexture)

export let whiteMaterial = new MeshBasicMaterial({
    color: 0xffffff,
})

export let xAxisLine = new Mesh(lineGeometry, transparentMaterial)
xAxisLine.name = 'xAxisLine'
export let xAxisClick = new Mesh(lineGeometryClick, transparentMaterial)
xAxisClick.name = 'xAxisClick'
export let xAxisArrow = new Mesh(arrowGeometry, transparentMaterial)
xAxisArrow.name = 'xAxisArrow'

export let yAxisLine = new Mesh(lineGeometry, transparentMaterial)
yAxisLine.name = 'yAxisLine'
export let yAxisClick = new Mesh(lineGeometryClick, transparentMaterial)
yAxisClick.name = 'yAxisClick'
export let yAxisArrow = new Mesh(arrowGeometry, transparentMaterial)
yAxisArrow.name = 'yAxisArrow'

export let zAxisLine = new Mesh(lineGeometry, transparentMaterial)
zAxisLine.name = 'zAxisLine'
export let zAxisClick = new Mesh(lineGeometryClick, transparentMaterial)
zAxisClick.name = 'zAxisClick'
export let zAxisArrow = new Mesh(arrowGeometry, transparentMaterial)
zAxisArrow.name = 'zAxisArrow'

export let circleStrength = 1
export let circlethickness = 1
export let circleGlow = 0
export let circleSample = 1

export let xAxisCircle = new Mesh(circleGeometry, transparentMaterial)
xAxisCircle.name = 'xAxisCircle'
export let xAxisOuter = new Mesh(circleGeometry, transparentMaterial)
xAxisOuter.name = 'xAxisOuter'
export let xAxisInner = new Mesh(circleGeometry, transparentMaterial)
xAxisInner.name = 'xAxisInner'

export let yAxisCircle = new Mesh(circleGeometry, transparentMaterial)
yAxisCircle.name = 'yAxisCircle'
export let yAxisOuter = new Mesh(circleGeometry, transparentMaterial)
yAxisOuter.name = 'yAxisOuter'
export let yAxisInner = new Mesh(circleGeometry, transparentMaterial)
yAxisInner.name = 'yAxisInner'

export let zAxisCircle = new Mesh(circleGeometry, transparentMaterial)
zAxisCircle.name = 'zAxisCircle'
export let zAxisOuter = new Mesh(circleGeometry, transparentMaterial)
zAxisOuter.name = 'zAxisOuter'
export let zAxisInner = new Mesh(circleGeometry, transparentMaterial)
zAxisInner.name = 'zAxisInner'

xAxisLine.rotation.z = Math.PI / 2
xAxisClick.rotation.z = Math.PI / 2
xAxisArrow.position.y = 1.15
xAxisLine.add(xAxisArrow)

yAxisArrow.position.y = 1.15
yAxisLine.add(yAxisArrow)

zAxisLine.rotation.x = Math.PI / 2
zAxisClick.rotation.x = Math.PI / 2
zAxisArrow.position.y = 1.15
zAxisLine.add(zAxisArrow)

xAxisCircle.rotation.order = 'ZYX'
xAxisCircle.rotation.y = Math.PI / 2
xAxisOuter.rotation.order = 'ZYX'
xAxisOuter.rotation.y = Math.PI / 2
xAxisOuter.scale.setScalar(1.1)
xAxisInner.rotation.order = 'ZYX'
xAxisInner.rotation.y = Math.PI / 2
xAxisInner.scale.setScalar(0.9)

yAxisCircle.rotation.order = 'ZYX'
yAxisCircle.rotation.x = Math.PI / 2
yAxisOuter.rotation.order = 'ZYX'
yAxisOuter.rotation.x = Math.PI / 2
yAxisOuter.scale.setScalar(1.1)
yAxisInner.rotation.order = 'ZYX'
yAxisInner.rotation.x = Math.PI / 2
yAxisInner.scale.setScalar(0.9)

zAxisCircle.rotation.order = 'ZYX'
zAxisOuter.rotation.order = 'ZYX'
zAxisOuter.scale.setScalar(1.1)
zAxisInner.rotation.order = 'ZYX'
zAxisInner.scale.setScalar(0.9)

export const pointGeometry = new SphereGeometry(0.1, 16, 16) // adjust the first value for the 'point' radius
export const pointMaterial = new MeshBasicMaterial({ color: 0xffff00 }) // adjust the color of your 'point'
export const point3D = new Mesh(pointGeometry, pointMaterial)
point3D.name = 'OriginSphere'

const linePoints = [new Vector3(0, -0.5, 0), new Vector3(0, 0.5, 0)]
const gridGeometry = new BufferGeometry().setFromPoints(linePoints)
const gridMaterial = new LineBasicMaterial({ color: 0x000000 })

export const grid = new Object3D()
grid.name = 'Grid'
for (let x = 0; x < 16; x++) {
    const line = new Line(gridGeometry, gridMaterial)
    line.rotation.x = Math.PI / 2
    line.position.x = x - 7.5
    line.scale.y = 15
    grid.add(line)
}
for (let z = 0; z < 16; z++) {
    const line = new Line(gridGeometry, gridMaterial)
    line.rotation.z = Math.PI / 2
    line.rotation.x = Math.PI / 2
    line.position.z = z - 7.5
    line.scale.y = 15
    grid.add(line)
}

// TODO ground plane (horizontally snapping grid, but not vertically)

export function resizeWindow() {
    width = window.innerWidth
    height = window.innerHeight * (1 - timelineHeight)

    renderer.setSize(width, height)
    composer.setSize(width, height)

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    insideCamera.aspect = width / height
    insideCamera.updateProjectionMatrix()

    timelineContext.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height)
    timelineContext.beginPath()
    for (let l = 0; l < timelineLabels.length; l++) {
        const label = timelineLabels[l] as HTMLDivElement

        label.style.fontSize = ((window.innerHeight * timelineHeight) / timelineLabels.length) * 0.7 + 'px'
        label.style.height = (timelineHeight * window.innerHeight) / timelineLabels.length + 'px'
        label.style.top = `${(l * timelineHeight * window.innerHeight) / timelineLabels.length}px`

        if (l < timelineLabels.length - 1) {
            timelineContext.moveTo(0, ((l + 1) * timelineCanvas.height) / timelineLabels.length)
            timelineContext.lineTo(timelineCanvas.width, ((l + 1) * timelineCanvas.height) / timelineLabels.length)
        }
    }
    timelineContext.strokeStyle = '#ffffff'
    timelineContext.stroke()
}

export function updatePasses() {
    raycaster.setFromCamera(mouse, camera)

    const xOuter = raycaster.intersectObject(xAxisOuter)
    const xInner = raycaster.intersectObject(xAxisInner)
    const yOuter = raycaster.intersectObject(yAxisOuter)
    const yInner = raycaster.intersectObject(yAxisInner)
    const zOuter = raycaster.intersectObject(zAxisOuter)
    const zInner = raycaster.intersectObject(zAxisInner)
    const xLine = raycaster.intersectObject(xAxisClick)
    const yLine = raycaster.intersectObject(yAxisClick)
    const zLine = raycaster.intersectObject(zAxisClick)

    let isXRot = xOuter.length > 0 && xInner.length == 0 && properties.rotatex.enabled()
    let isYRot = yOuter.length > 0 && yInner.length == 0 && properties.rotatey.enabled()
    let isZRot = zOuter.length > 0 && zInner.length == 0 && properties.rotatez.enabled()

    if (!properties.translatex.enabled()) {
        composer.removePass(xTranslateOutline)
    } else {
        if (!composer.passes.includes(xTranslateOutline)) {
            composer.addPass(xTranslateOutline)
        }
    }
    if (!properties.translatey.enabled()) {
        composer.removePass(yTranslateOutline)
    } else {
        if (!composer.passes.includes(yTranslateOutline)) {
            composer.addPass(yTranslateOutline)
        }
    }
    if (!properties.translatez.enabled()) {
        composer.removePass(zTranslateOutline)
    } else {
        if (!composer.passes.includes(zTranslateOutline)) {
            composer.addPass(zTranslateOutline)
        }
    }

    if (!properties.rotatex.enabled()) {
        composer.removePass(xRotateOutline)
    } else {
        if (!composer.passes.includes(xRotateOutline)) {
            composer.addPass(xRotateOutline)
        }
    }
    if (!properties.rotatey.enabled()) {
        composer.removePass(yRotateOutline)
    } else {
        if (!composer.passes.includes(yRotateOutline)) {
            composer.addPass(yRotateOutline)
        }
    }
    if (!properties.rotatez.enabled()) {
        composer.removePass(zRotateOutline)
    } else {
        if (!composer.passes.includes(zRotateOutline)) {
            composer.addPass(zRotateOutline)
        }
    }

    if ((rotating !== '' || translating !== '') && rotating !== 'x') composer.removePass(xRotateOutline)
    if ((rotating !== '' || translating !== '') && rotating !== 'y') composer.removePass(yRotateOutline)
    if ((rotating !== '' || translating !== '') && rotating !== 'z') composer.removePass(zRotateOutline)
    if ((translating !== '' || rotating !== '') && translating !== 'x') composer.removePass(xTranslateOutline)
    if ((translating !== '' || rotating !== '') && translating !== 'y') composer.removePass(yTranslateOutline)
    if ((translating !== '' || rotating !== '') && translating !== 'z') composer.removePass(zTranslateOutline)

    setControlsColour('#ffffff')

    if (rotating !== 'x' && !isXRot) {
        xRotateOutline.visibleEdgeColor.set('#ff0000')
        xRotateOutline.hiddenEdgeColor.set('#ff0000')
    }
    if (rotating !== 'y' && (!isYRot || isXRot)) {
        yRotateOutline.visibleEdgeColor.set('#00ff00')
        yRotateOutline.hiddenEdgeColor.set('#00ff00')
    }
    if (rotating !== 'z' && (!isZRot || isXRot || isYRot)) {
        zRotateOutline.visibleEdgeColor.set('#0000ff')
        zRotateOutline.hiddenEdgeColor.set('#0000ff')
    }

    const isRotate = isXRot || isYRot || isZRot
    if (translating !== 'x' && (xLine.length === 0 || isRotate)) {
        xTranslateOutline.visibleEdgeColor.set('#ff0000')
        xTranslateOutline.hiddenEdgeColor.set('#ff0000')
    }
    if (translating !== 'y' && (yLine.length === 0 || isRotate || xLine.length > 0)) {
        yTranslateOutline.visibleEdgeColor.set('#00ff00')
        yTranslateOutline.hiddenEdgeColor.set('#00ff00')
    }
    if (translating !== 'z' && (zLine.length === 0 || isRotate || xLine.length > 0 || yLine.length > 0)) {
        zTranslateOutline.visibleEdgeColor.set('#0000ff')
        zTranslateOutline.hiddenEdgeColor.set('#0000ff')
    }
}

export function setControlsColour(colour: string) {
    xRotateOutline.visibleEdgeColor.set(colour)
    yRotateOutline.visibleEdgeColor.set(colour)
    zRotateOutline.visibleEdgeColor.set(colour)
    xTranslateOutline.visibleEdgeColor.set(colour)
    yTranslateOutline.visibleEdgeColor.set(colour)
    zTranslateOutline.visibleEdgeColor.set(colour)
    xRotateOutline.hiddenEdgeColor.set(colour)
    yRotateOutline.hiddenEdgeColor.set(colour)
    zRotateOutline.hiddenEdgeColor.set(colour)
    xTranslateOutline.hiddenEdgeColor.set(colour)
    yTranslateOutline.hiddenEdgeColor.set(colour)
    zTranslateOutline.hiddenEdgeColor.set(colour)
}

export function resetControlsColour() {
    xRotateOutline.visibleEdgeColor.set('#ff0000')
    yRotateOutline.visibleEdgeColor.set('#00ff00')
    zRotateOutline.visibleEdgeColor.set('#0000ff')
    xTranslateOutline.visibleEdgeColor.set('#ff0000')
    yTranslateOutline.visibleEdgeColor.set('#00ff00')
    zTranslateOutline.visibleEdgeColor.set('#0000ff')
    xRotateOutline.hiddenEdgeColor.set('#ff0000')
    yRotateOutline.hiddenEdgeColor.set('#00ff00')
    zRotateOutline.hiddenEdgeColor.set('#0000ff')
    xTranslateOutline.hiddenEdgeColor.set('#ff0000')
    yTranslateOutline.hiddenEdgeColor.set('#00ff00')
    zTranslateOutline.hiddenEdgeColor.set('#0000ff')
}

export function initRender() {
    renderPass = new RenderPass(scene, camera)
    selectedOutlinePassLine = new OutlinePassLine(new Vector2(width, height), scene, camera)

    selectedOutlinePassLine.visibleEdgeColor.set('#ffffff')
    selectedOutlinePassLine.hiddenEdgeColor.set('#ffffff')
    selectedOutlinePassLine.overlayMaterial.blending = NormalBlending
    selectedOutlinePassLine.edgeStrength = circleStrength
    selectedOutlinePassLine.edgeThickness = circlethickness
    selectedOutlinePassLine.edgeGlow = circleGlow
    selectedOutlinePassLine.downSampleRatio = circleSample

    xRotateOutline = new OutlinePassLine(new Vector2(width, height), scene, camera)
    yRotateOutline = new OutlinePassLine(new Vector2(width, height), scene, camera)
    zRotateOutline = new OutlinePassLine(new Vector2(width, height), scene, camera)
    xTranslateOutline = new OutlinePassFill(new Vector2(width, height), scene, camera)
    yTranslateOutline = new OutlinePassFill(new Vector2(width, height), scene, camera)
    zTranslateOutline = new OutlinePassFill(new Vector2(width, height), scene, camera)

    // TODO make arrow render order match up with order of highlight
    xRotateOutline.visibleEdgeColor.set('#ff0000')
    xRotateOutline.hiddenEdgeColor.set('#ff0000')
    xRotateOutline.overlayMaterial.blending = NormalBlending
    xRotateOutline.edgeStrength = circleStrength
    xRotateOutline.edgeThickness = circlethickness
    xRotateOutline.edgeGlow = circleGlow
    xRotateOutline.downSampleRatio = circleSample

    xRotateOutline.selectedObjects = [xAxisCircle]

    yRotateOutline.visibleEdgeColor.set('#00ff00')
    yRotateOutline.hiddenEdgeColor.set('#00ff00')
    yRotateOutline.overlayMaterial.blending = NormalBlending
    yRotateOutline.edgeStrength = circleStrength
    yRotateOutline.edgeThickness = circlethickness
    yRotateOutline.edgeGlow = circleGlow
    yRotateOutline.downSampleRatio = circleSample

    yRotateOutline.selectedObjects = [yAxisCircle]

    zRotateOutline.visibleEdgeColor.set('#0000ff')
    zRotateOutline.hiddenEdgeColor.set('#0000ff')
    zRotateOutline.overlayMaterial.blending = NormalBlending
    zRotateOutline.edgeStrength = circleStrength
    zRotateOutline.edgeThickness = circlethickness
    zRotateOutline.edgeGlow = circleGlow
    zRotateOutline.downSampleRatio = circleSample

    zRotateOutline.selectedObjects = [zAxisCircle]

    xTranslateOutline.visibleEdgeColor.set('#ff0000')
    xTranslateOutline.hiddenEdgeColor.set('#ff0000')
    xTranslateOutline.overlayMaterial.blending = NormalBlending
    xTranslateOutline.edgeStrength = circleStrength
    xTranslateOutline.edgeThickness = circlethickness
    xTranslateOutline.edgeGlow = circleGlow
    xTranslateOutline.downSampleRatio = circleSample

    xTranslateOutline.selectedObjects = [xAxisLine]

    yTranslateOutline.visibleEdgeColor.set('#00ff00')
    yTranslateOutline.hiddenEdgeColor.set('#00ff00')
    yTranslateOutline.overlayMaterial.blending = NormalBlending
    yTranslateOutline.edgeStrength = circleStrength
    yTranslateOutline.edgeThickness = circlethickness
    yTranslateOutline.edgeGlow = circleGlow
    yTranslateOutline.downSampleRatio = circleSample

    yTranslateOutline.selectedObjects = [yAxisLine]

    zTranslateOutline.visibleEdgeColor.set('#0000ff')
    zTranslateOutline.hiddenEdgeColor.set('#0000ff')
    zTranslateOutline.overlayMaterial.blending = NormalBlending
    zTranslateOutline.edgeStrength = circleStrength
    zTranslateOutline.edgeThickness = circlethickness
    zTranslateOutline.edgeGlow = circleGlow
    zTranslateOutline.downSampleRatio = circleSample

    zTranslateOutline.selectedObjects = [zAxisLine]

    composer = new EffectComposer(renderer)

    composer.addPass(renderPass)
    composer.addPass(copyPass)
    composer.addPass(selectedOutlinePassLine)
    composer.render(0.05)

    scene.add(point3D)
    scene.add(grid)
    // scene.add(testViewArrow);

    renderer.domElement.addEventListener('mousedown', onSceneMouseDown)
}
