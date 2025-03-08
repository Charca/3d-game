import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

// Scene setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 5, 5)
directionalLight.castShadow = true
scene.add(directionalLight)

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100)
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// Obstacles
const obstacles = []

function createBox(width, height, depth, x, y, z, color = 0x8b4513) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({ color })
  const box = new THREE.Mesh(geometry, material)
  box.position.set(x, y + height / 2, z)
  box.castShadow = true
  box.receiveShadow = true
  scene.add(box)
  obstacles.push({
    mesh: box,
    width,
    height,
    depth,
  })
  return box
}

// Create various boxes around the map
createBox(4, 2, 4, -8, 0, -8) // Large platform
createBox(3, 1, 3, 8, 0, -8) // Medium platform
createBox(2, 3, 2, 0, 0, -12) // Tall platform
createBox(6, 0.5, 2, -4, 0, 4) // Long low platform
createBox(2, 1.5, 2, 6, 0, 6) // Small platform
createBox(3, 2, 3, -6, 0, 8) // Another medium platform

// Character
let character = null
let mixer = null
let walkAction = null
let isWalking = false
const modelScale = 0.02 // Adjust this value based on your model's size

// Camera setup
camera.position.set(0, 4, 8)
camera.lookAt(new THREE.Vector3(0, 1, 0)) // Look at default position until character loads

// Load character model
const loader = new FBXLoader()
loader.load(
  '/models/walking.fbx',
  (fbx) => {
    character = fbx
    character.scale.set(modelScale, modelScale, modelScale)
    character.position.y = 1
    character.castShadow = true
    character.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
      }
    })
    scene.add(character)

    // Setup animation
    mixer = new THREE.AnimationMixer(character)
    const animations = character.animations
    if (animations && animations.length > 0) {
      walkAction = mixer.clipAction(animations[0])
      walkAction.setLoop(THREE.LoopRepeat)
      walkAction.clampWhenFinished = true
      walkAction.play()
      // Initially pause the animation
      walkAction.paused = true
    }

    // Update camera to look at character once loaded
    camera.lookAt(character.position)
  },
  (progress) => {
    console.log(
      'Loading model:',
      (progress.loaded / progress.total) * 100 + '%'
    )
  },
  (error) => {
    console.error('Error loading model:', error)
    // Create a fallback box character if model fails to load
    const geometry = new THREE.BoxGeometry(1, 2, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    character = new THREE.Mesh(geometry, material)
    character.position.y = 1
    character.castShadow = true
    scene.add(character)
    camera.lookAt(character.position)
  }
)

// Character movement
const moveSpeed = 0.1
const jumpForce = 0.15
let velocity = new THREE.Vector3()
let isJumping = false

// Mouse control
let mouseX = 0
let mouseY = 0
let targetRotation = 0
let targetVerticalRotation = 0
const verticalRotationLimit = Math.PI / 6
const initialCameraHeight = 4

document.addEventListener('mousemove', (event) => {
  const movementX = event.movementX || 0
  const movementY = event.movementY || 0

  targetRotation -= movementX * 0.002
  targetVerticalRotation = Math.max(
    -verticalRotationLimit / 2,
    Math.min(verticalRotationLimit, targetVerticalRotation + movementY * 0.002)
  )
})

// Lock pointer for mouse control
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock()
})

// Movement controls
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
}

document.addEventListener('keydown', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      keys.w = true
      break
    case 'a':
      keys.a = true
      break
    case 's':
      keys.s = true
      break
    case 'd':
      keys.d = true
      break
    case ' ':
      if (!isJumping) {
        velocity.y = jumpForce
        isJumping = true
      }
      break
  }
})

document.addEventListener('keyup', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      keys.w = false
      break
    case 'a':
      keys.a = false
      break
    case 's':
      keys.s = false
      break
    case 'd':
      keys.d = false
      break
    case ' ':
      keys.space = false
      break
  }
})

// Physics
const gravity = -0.005

function checkCollisions() {
  if (!character) return // Skip if character isn't loaded yet

  // Check collision with each obstacle
  for (const obstacle of obstacles) {
    const box = obstacle.mesh
    const characterBottom = character.position.y - 1
    const characterTop = character.position.y + 1

    // Check if character is within the horizontal bounds of the box
    const withinX =
      Math.abs(character.position.x - box.position.x) < obstacle.width / 2 + 0.5
    const withinZ =
      Math.abs(character.position.z - box.position.z) < obstacle.depth / 2 + 0.5

    if (withinX && withinZ) {
      const boxTop = box.position.y + obstacle.height / 2

      // Check if character is landing on top of the box
      if (
        characterBottom <= boxTop &&
        characterBottom > boxTop - 0.2 &&
        velocity.y <= 0
      ) {
        character.position.y = boxTop + 1
        velocity.y = 0
        isJumping = false
      }
      // Check if character is hitting the box from the sides or bottom
      else if (
        characterBottom < boxTop &&
        characterTop > box.position.y - obstacle.height / 2
      ) {
        // Push character out horizontally
        if (
          Math.abs(character.position.x - box.position.x) >
          Math.abs(character.position.z - box.position.z)
        ) {
          character.position.x =
            box.position.x +
            (character.position.x > box.position.x ? 1 : -1) *
              (obstacle.width / 2 + 0.5)
        } else {
          character.position.z =
            box.position.z +
            (character.position.z > box.position.z ? 1 : -1) *
              (obstacle.depth / 2 + 0.5)
        }
      }
    }
  }

  // Ground collision
  if (character.position.y <= 1) {
    character.position.y = 1
    velocity.y = 0
    isJumping = false
  }
}

function updatePhysics() {
  if (!character) return // Skip if character isn't loaded yet

  // Apply gravity
  velocity.y += gravity
  character.position.y += velocity.y

  // Check all collisions
  checkCollisions()
}

function updateMovement() {
  if (!character) return // Skip if character isn't loaded yet

  // Calculate forward direction based on character rotation
  const forward = new THREE.Vector3(0, 0, -1)
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y)
  const right = new THREE.Vector3(-forward.z, 0, forward.x)

  // Track if character is moving
  const wasWalking = isWalking
  isWalking = keys.w || keys.s || keys.a || keys.d

  // Handle animation state changes
  if (walkAction) {
    if (isWalking && walkAction.paused) {
      walkAction.paused = false
    } else if (!isWalking && !walkAction.paused) {
      walkAction.paused = true
    }
  }

  // Apply movement based on key states
  if (keys.w) character.position.add(forward.multiplyScalar(moveSpeed))
  if (keys.s) character.position.add(forward.multiplyScalar(-moveSpeed))
  if (keys.a) character.position.add(right.multiplyScalar(-moveSpeed))
  if (keys.d) character.position.add(right.multiplyScalar(moveSpeed))

  // Smooth character rotation
  character.rotation.y += (targetRotation - character.rotation.y) * 0.1
}

function updateCamera() {
  if (!character) return // Skip if character isn't loaded yet

  // Calculate camera position based on character position and rotation
  const cameraOffset = new THREE.Vector3(0, initialCameraHeight, 8)

  // Apply vertical rotation first
  cameraOffset.applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    targetVerticalRotation
  )
  // Then apply horizontal rotation
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y)

  camera.position.copy(character.position).add(cameraOffset)
  camera.lookAt(character.position)
}

// Animation loop
function animate() {
  requestAnimationFrame(animate)

  // Update animation mixer
  if (mixer) {
    mixer.update(0.016) // Update animations (assuming 60fps)
  }

  updatePhysics()
  updateMovement()
  updateCamera()

  renderer.render(scene, camera)
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

animate()
