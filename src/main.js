import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

// Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xffd700) // Yellow sky color
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Softer shadows
renderer.outputEncoding = THREE.sRGBEncoding // Better color accuracy
renderer.toneMapping = THREE.ACESFilmicToneMapping // More realistic tone mapping
renderer.toneMappingExposure = 1.0
document.body.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4) // Increased from 0.3 to 0.4
scene.add(ambientLight)

// Main directional light (sun)
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2) // Increased intensity
mainLight.position.set(15, 15, 15) // Adjusted position for better coverage
mainLight.castShadow = true
mainLight.shadow.mapSize.width = 2048
mainLight.shadow.mapSize.height = 2048
mainLight.shadow.camera.near = 0.5
mainLight.shadow.camera.far = 50
mainLight.shadow.camera.left = -30
mainLight.shadow.camera.right = 30
mainLight.shadow.camera.top = 30
mainLight.shadow.camera.bottom = -30
mainLight.shadow.bias = -0.0001
scene.add(mainLight)

// Fill light
const fillLight = new THREE.DirectionalLight(0x9ca3af, 0.6) // Increased from 0.4 to 0.6
fillLight.position.set(-10, 8, -10) // Adjusted height
scene.add(fillLight)

// Rim light
const rimLight = new THREE.DirectionalLight(0xffffff, 0.4) // Increased from 0.3 to 0.4
rimLight.position.set(5, 5, -10) // Adjusted height
scene.add(rimLight)

// Ground light (bounce light simulation)
const groundLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5) // Increased from 0.4 to 0.5
scene.add(groundLight)

// Character spotlight
let characterLight = new THREE.SpotLight(0xffffff, 0.8)
characterLight.position.set(0, 10, 0)
characterLight.angle = Math.PI / 3
characterLight.penumbra = 0.5
characterLight.decay = 1
characterLight.distance = 25
characterLight.castShadow = true
characterLight.shadow.bias = -0.001
scene.add(characterLight)

// Character light target
const characterLightTarget = new THREE.Object3D()
scene.add(characterLightTarget)
characterLight.target = characterLightTarget

// Ground material with better shading
const groundGeometry = new THREE.PlaneGeometry(100, 100)
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  roughness: 0.8,
  metalness: 0.2,
})
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// Cloud system
const clouds = []

function createCloud(x, y, z) {
  const cloudGroup = new THREE.Group()

  // Create multiple spheres for each cloud
  const numPuffs = 5 + Math.floor(Math.random() * 4)
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: 0.8,
  })

  for (let i = 0; i < numPuffs; i++) {
    const puffSize = 2 + Math.random() * 2
    const puffGeometry = new THREE.SphereGeometry(puffSize, 16, 16)
    const puff = new THREE.Mesh(puffGeometry, cloudMaterial)

    // Position each puff slightly offset from the center
    puff.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 4
    )

    cloudGroup.add(puff)
  }

  cloudGroup.position.set(x, y, z)
  scene.add(cloudGroup)

  // Add to clouds array with movement properties
  clouds.push({
    mesh: cloudGroup,
    speed: 0.01 + Math.random() * 0.02,
    startX: x,
  })
}

// Create several clouds at different positions
for (let i = 0; i < 10; i++) {
  const x = (Math.random() - 0.5) * 80
  const y = 15 + Math.random() * 5 // Lowered from 30-40 to 15-20
  const z = (Math.random() - 0.5) * 80
  createCloud(x, y, z)
}

// Add cloud movement to animation loop
function updateClouds() {
  clouds.forEach((cloud) => {
    cloud.mesh.position.x += cloud.speed

    // Reset cloud position when it moves too far
    if (cloud.mesh.position.x > 50) {
      cloud.mesh.position.x = -50
      // Randomize height when cloud resets
      cloud.mesh.position.y = 15 + Math.random() * 5
      cloud.mesh.position.z = (Math.random() - 0.5) * 80
    }
  })
}

// UI Setup
const donutCounter = document.createElement('div')
donutCounter.style.position = 'absolute'
donutCounter.style.top = '20px'
donutCounter.style.left = '20px'
donutCounter.style.color = 'white'
donutCounter.style.fontSize = '24px'
donutCounter.style.fontFamily = 'Arial, sans-serif'
donutCounter.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)'
document.body.appendChild(donutCounter)

let donutsCollected = 0
const updateDonutCounter = () => {
  donutCounter.textContent = `Donuts: ${donutsCollected}`
}
updateDonutCounter()

// Donuts
const donuts = []

function createDonut(x, y, z) {
  const torusGeometry = new THREE.TorusGeometry(0.3, 0.15, 16, 32) // Reduced from 0.5, 0.25
  const donutMaterial = new THREE.MeshStandardMaterial({
    color: 0xff69b4, // Pink color for the donut
    roughness: 0.6,
    metalness: 0.2,
  })
  const donut = new THREE.Mesh(torusGeometry, donutMaterial)
  donut.position.set(x, y, z)
  donut.rotation.x = Math.PI / 2 // Make donut lay flat
  donut.castShadow = true
  donut.receiveShadow = true
  scene.add(donut)
  donuts.push({
    mesh: donut,
    collected: false,
  })
  return donut
}

// Function to get random position within map bounds
function getRandomDonutPosition() {
  const mapSize = 40 // Size of playable area
  const x = (Math.random() - 0.5) * mapSize
  const z = (Math.random() - 0.5) * mapSize
  return { x, z }
}

// Create 50 donuts around the map
for (let i = 0; i < 50; i++) {
  if (i < 15) {
    // 15 donuts on platforms
    const platforms = [
      { x: -8, y: 2, z: -8, width: 4, depth: 4 }, // Large platform
      { x: 8, y: 1, z: -8, width: 3, depth: 3 }, // Medium platform
      { x: 0, y: 3, z: -12, width: 2, depth: 2 }, // Tall platform
      { x: -4, y: 0.5, z: 4, width: 6, depth: 2 }, // Long low platform
      { x: 6, y: 1.5, z: 6, width: 2, depth: 2 }, // Small platform
      { x: -6, y: 2, z: 8, width: 3, depth: 3 }, // Another medium platform
    ]
    const platform = platforms[Math.floor(Math.random() * platforms.length)]

    // Place donut on platform surface with offset from edges
    const offsetX = (Math.random() - 0.5) * (platform.width - 0.5)
    const offsetZ = (Math.random() - 0.5) * (platform.depth - 0.5)

    createDonut(
      platform.x + offsetX,
      platform.y + 0.15, // Just above platform surface
      platform.z + offsetZ
    )
  } else {
    // Remaining donuts on ground
    const pos = getRandomDonutPosition()
    createDonut(pos.x, 0.15, pos.z) // Just above ground level
  }
}

// Obstacles
const obstacles = []

function createBox(width, height, depth, x, y, z, color = 0x8b4513) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.1,
  })
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

// Camera controls
const minZoomDistance = 3
const maxZoomDistance = 15
let cameraDistance = 8 // Initial camera distance
const zoomSpeed = 0.5

// Add wheel event listener for zoom
document.addEventListener('wheel', (event) => {
  // Zoom in/out based on wheel direction
  cameraDistance += event.deltaY * 0.01 * zoomSpeed

  // Clamp the distance between min and max values
  cameraDistance = Math.max(
    minZoomDistance,
    Math.min(maxZoomDistance, cameraDistance)
  )
})

// Load character model
const loader = new FBXLoader()
loader.load(
  '/models/walking.fbx',
  (fbx) => {
    character = fbx
    character.scale.set(modelScale, modelScale, modelScale)
    character.position.y = 0
    character.rotation.y = 0 // Changed from Math.PI to 0
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
    character.position.y = 0
    character.rotation.y = 0 // Changed from Math.PI to 0
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
let targetCharacterRotation = 0 // Added: Target rotation for smooth interpolation
const rotationSpeed = 0.1 // Added: Controls how fast the character turns

// Mouse control
let mouseX = 0
let mouseY = 0
let cameraRotation = 0 // Changed from targetRotation
let targetVerticalRotation = 0
const verticalRotationLimit = Math.PI / 6
const initialCameraHeight = 4

document.addEventListener('mousemove', (event) => {
  const movementX = event.movementX || 0
  const movementY = event.movementY || 0

  cameraRotation -= movementX * 0.001 // Reduced from 0.002 to 0.001
  targetVerticalRotation = Math.max(
    -verticalRotationLimit / 2,
    Math.min(verticalRotationLimit, targetVerticalRotation + movementY * 0.001) // Reduced from 0.002 to 0.001
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
    const characterBottom = character.position.y // Changed from character.position.y - 1
    const characterTop = character.position.y + 2 // Changed from character.position.y + 1

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
  if (character.position.y <= 0) {
    // Changed from 1 to 0
    character.position.y = 0 // Changed from 1 to 0
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
  if (!character) return

  // Calculate movement direction based on camera rotation
  const forward = new THREE.Vector3(0, 0, -1)
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation)
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

  // Store the movement direction for character rotation
  let moveDirection = new THREE.Vector3(0, 0, 0)

  // Apply movement based on key states
  if (keys.w) moveDirection.add(forward)
  if (keys.s) moveDirection.add(forward.clone().multiplyScalar(-1))
  if (keys.a) moveDirection.add(right.clone().multiplyScalar(-1))
  if (keys.d) moveDirection.add(right)

  // If there's movement, normalize and apply it
  if (moveDirection.length() > 0) {
    moveDirection.normalize()
    character.position.add(moveDirection.multiplyScalar(moveSpeed))

    // Update target rotation based on movement direction
    targetCharacterRotation = Math.atan2(moveDirection.x, moveDirection.z)
  }

  // Smoothly interpolate current rotation to target rotation
  const currentRotation = character.rotation.y
  const rotationDiff = targetCharacterRotation - currentRotation

  // Normalize the rotation difference to handle the -PI to PI transition
  let normalizedDiff = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI

  // Apply smooth rotation
  character.rotation.y += normalizedDiff * rotationSpeed
}

function updateCamera() {
  if (!character) return

  // Calculate camera position based on character position and rotation
  const cameraOffset = new THREE.Vector3(0, initialCameraHeight, cameraDistance)

  // Apply vertical rotation first
  cameraOffset.applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    targetVerticalRotation
  )
  // Then apply horizontal rotation using camera rotation
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation)

  // Calculate new camera position
  const newCameraPosition = character.position.clone().add(cameraOffset)

  // Check if camera would go below ground level (with a small buffer)
  const minCameraHeight = 0.5 // Minimum height above ground
  if (newCameraPosition.y < minCameraHeight) {
    // Adjust the vertical offset to keep camera above ground
    const heightDiff = minCameraHeight - newCameraPosition.y
    newCameraPosition.y = minCameraHeight

    // Adjust the look-at point to maintain similar viewing angle
    const lookAtPoint = character.position.clone()
    lookAtPoint.y += heightDiff * 0.5 // Adjust look-at point up slightly
    camera.position.copy(newCameraPosition)
    camera.lookAt(lookAtPoint)
  } else {
    // Normal camera update
    camera.position.copy(newCameraPosition)
    camera.lookAt(character.position)
  }

  // Update character light position and target
  characterLight.position
    .copy(character.position)
    .add(new THREE.Vector3(0, 10, 0))
  characterLightTarget.position.copy(character.position)
}

// Add donut collection check to the update loop
function checkDonutCollection() {
  if (!character) return

  const collectionRadius = 1.5 // How close the character needs to be to collect

  donuts.forEach((donut) => {
    if (!donut.collected) {
      const distance = character.position.distanceTo(donut.mesh.position)

      if (distance < collectionRadius) {
        donut.collected = true
        donut.mesh.visible = false
        donutsCollected++
        updateDonutCounter()
      }
    }
  })
}

// Ball physics
const ball = {
  mesh: null,
  velocity: new THREE.Vector3(),
  radius: 0.5,
  friction: 0.98,
  bounce: 0.7,
}

// Create ball
function createBall() {
  const geometry = new THREE.SphereGeometry(ball.radius, 32, 32)
  const material = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.4,
    metalness: 0.3,
  })
  ball.mesh = new THREE.Mesh(geometry, material)
  ball.mesh.position.set(2, ball.radius, 0) // Start near character
  ball.mesh.castShadow = true
  ball.mesh.receiveShadow = true
  scene.add(ball.mesh)
}

createBall()

function updateBall() {
  if (!ball.mesh || !character) return

  // Apply gravity
  ball.velocity.y += gravity * 2

  // Apply velocity
  ball.mesh.position.add(ball.velocity)

  // Ground collision
  if (ball.mesh.position.y <= ball.radius) {
    ball.mesh.position.y = ball.radius
    ball.velocity.y *= -ball.bounce
    // Apply friction when on ground
    ball.velocity.x *= ball.friction
    ball.velocity.z *= ball.friction
  }

  // Character collision (kick the ball)
  const characterToBall = new THREE.Vector3()
  characterToBall.subVectors(ball.mesh.position, character.position)
  const distance = characterToBall.length()

  if (distance < ball.radius + 1) {
    // 1 is approximate character radius
    // Normalize kick direction and apply force
    characterToBall.normalize()

    // Calculate kick strength based on character's movement
    let kickStrength = 0.2
    if (keys.w || keys.s || keys.a || keys.d) {
      kickStrength = 0.4 // Stronger kick when moving
    }

    ball.velocity.add(characterToBall.multiplyScalar(kickStrength))
    ball.velocity.y = 0.15 // Add slight upward force
  }

  // Box collisions
  obstacles.forEach((obstacle) => {
    const box = obstacle.mesh
    const ballToBox = new THREE.Vector3()
    ballToBox.subVectors(ball.mesh.position, box.position)

    // Check if ball is within box bounds (with radius)
    if (
      Math.abs(ballToBox.x) < obstacle.width / 2 + ball.radius &&
      Math.abs(ballToBox.z) < obstacle.depth / 2 + ball.radius &&
      Math.abs(ballToBox.y) < obstacle.height / 2 + ball.radius
    ) {
      // Find closest face and bounce
      const faces = [
        {
          normal: new THREE.Vector3(1, 0, 0),
          dist: obstacle.width / 2 + ball.radius - Math.abs(ballToBox.x),
        },
        {
          normal: new THREE.Vector3(-1, 0, 0),
          dist: obstacle.width / 2 + ball.radius - Math.abs(ballToBox.x),
        },
        {
          normal: new THREE.Vector3(0, 1, 0),
          dist: obstacle.height / 2 + ball.radius - Math.abs(ballToBox.y),
        },
        {
          normal: new THREE.Vector3(0, -1, 0),
          dist: obstacle.height / 2 + ball.radius - Math.abs(ballToBox.y),
        },
        {
          normal: new THREE.Vector3(0, 0, 1),
          dist: obstacle.depth / 2 + ball.radius - Math.abs(ballToBox.z),
        },
        {
          normal: new THREE.Vector3(0, 0, -1),
          dist: obstacle.depth / 2 + ball.radius - Math.abs(ballToBox.z),
        },
      ]

      // Find closest face
      const closestFace = faces.reduce((prev, curr) =>
        prev.dist < curr.dist ? prev : curr
      )

      // Bounce off face
      const reflection = ball.velocity.reflect(closestFace.normal)
      ball.velocity.copy(reflection.multiplyScalar(ball.bounce))
    }
  })

  // Map bounds
  const mapBounds = 50
  if (Math.abs(ball.mesh.position.x) > mapBounds) {
    ball.mesh.position.x = Math.sign(ball.mesh.position.x) * mapBounds
    ball.velocity.x *= -ball.bounce
  }
  if (Math.abs(ball.mesh.position.z) > mapBounds) {
    ball.mesh.position.z = Math.sign(ball.mesh.position.z) * mapBounds
    ball.velocity.z *= -ball.bounce
  }
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
  updateClouds()
  updateBall() // Add ball update
  checkDonutCollection()

  renderer.render(scene, camera)
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

animate()
