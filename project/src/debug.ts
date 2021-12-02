import { camera } from './camera'
import { highlightedPart, movementAngle, movementOrigin } from './controls'
import { commandFrameData, frameData, partFrameData, tweenedFrameData } from './frames'
import { codes } from './input'
import { propertyInputOriginals } from './menu'
import { getHighlightedProperties } from './properties'
import { cubes, scene } from './util'

export function debugLog() {
  console.log('----DEBUG----')
  console.log('CUBES:')
  console.log(cubes)
  console.log('SCENE:')
  console.log(scene)
  console.log('FRAMEDATA:')
  console.log(frameData)
  console.log('TWEENEDFRAMEDATA:')
  console.log(tweenedFrameData)
  console.log('COMMANDFRAMEDATA:')
  console.log(commandFrameData)
  console.log('PARTFRAMEDATA:')
  console.log(partFrameData)
  console.log('HIGHLIGHTEDPART:')
  console.log(highlightedPart)
  console.log('CODES')
  console.log(codes)
  console.log('HIGHLIGHTEDPROPERTIES')
  console.log(getHighlightedProperties())
  console.log('PROPERTYINPUTORIGINALS')
  console.log(propertyInputOriginals)
  console.log('MOVEMENTORIGIN')
  console.log(movementOrigin)
  console.log('MOVEMENTANGLE')
  console.log(movementAngle)
  console.log('CAMERAPOS')
  console.log(camera.position)
  // console.log("MODELS");
  // console.log(models);
}
