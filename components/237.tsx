"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber"
import {
  Box,
  Plane,
  PointerLockControls,
  KeyboardControls,
  useKeyboardControls,
  Environment,
  PerspectiveCamera,
  useGLTF,
  OrbitControls,
  useAnimations,
} from "@react-three/drei"
import { Physics, usePlane, useBox, useSphere } from "@react-three/cannon"
import * as THREE from "three"
import { gsap } from "gsap"

// Larger, more complex maze layout (30x20)
const mazeLayout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const CELL_SIZE = 2
const HEDGE_HEIGHT = 3 * 1.75
const HEDGE_THICKNESS = 0.3
const PLAYER_HEIGHT = 1.7
const MOVEMENT_SPEED = 6
const PLAYER_RADIUS = 0.3
const AI_SPEED = 4
const CHASE_DISTANCE = 1000

function HedgeMaterial() {
  const [colorMap, normalMap, roughnessMap, aoMap] = useLoader(THREE.TextureLoader, [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Moss002_1K-JPG_Color-kfFgCRlBHy0CoS5TfgzMVaOT0u8OI4.jpg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Moss002_1K-JPG_NormalGL-UqPfFqqaKR3Fz3QVRE0A3c4JJk0tnM.jpg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Moss002_1K-JPG_Roughness-V6uedmVezVYGOMdoNYrRTuhiJgQ6DH.jpg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Moss002_1K-JPG_AmbientOcclusion-NFblk4lk0n9L4RrLyQ5ERjvoZDEjiw.jpg",
  ])

  const textures = [colorMap, roughnessMap, normalMap, aoMap]
  textures.forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, HEDGE_HEIGHT / 2)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
  })

  return (
    <meshStandardMaterial
      map={colorMap}
      normalMap={normalMap}
      roughnessMap={roughnessMap}
      aoMap={aoMap}
      metalness={0.1}
      roughness={0.8}
    />
  )
}

function GroundMaterial() {
  const [colorMap, roughnessMap, normalMap, aoMap] = useLoader(THREE.TextureLoader, [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow009A_1K-JPG_Color-ftnbZHGFOk6O5BGZf8eTBe2MczgDO5.jpg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow009A_1K-JPG_Roughness-hHoq0f4iMMKc7q8RMaePPRaQfN3nZg.jpg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow009A_1K-JPG_NormalGL-sxJSJh3TGj64frb00VuUjcswlH46vj.jpg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow009A_1K-JPG_AmbientOcclusion-zRyLk8QnKFVb3vQLJby98I88nw1Cm9.jpg",
  ])

  const textures = [colorMap, roughnessMap, normalMap, aoMap]
  textures.forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(30, 20)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
  })

  return (
    <meshStandardMaterial
      map={colorMap}
      roughnessMap={roughnessMap}
      normalMap={normalMap}
      aoMap={aoMap}
      metalness={0.1}
      roughness={0.8}
    />
  )
}

function PhysicalMaze() {
  return (
    <group>
      {mazeLayout.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (cell === 1) {
            const x = colIndex * CELL_SIZE - (mazeLayout[0].length * CELL_SIZE) / 2
            const z = rowIndex * CELL_SIZE - (mazeLayout.length * CELL_SIZE) / 2

            return (
              <Wall
                key={`${colIndex}-${rowIndex}`}
                position={[x + CELL_SIZE / 2, HEDGE_HEIGHT / 2, z + CELL_SIZE / 2]}
                size={[CELL_SIZE, HEDGE_HEIGHT, CELL_SIZE]}
              />
            )
          }
          return null
        }),
      )}
      <Ground />
    </group>
  )
}

type WallProps = {
  position: [number, number, number]
  size: [number, number, number]
}

function Wall({ position, size }: WallProps) {
  const [ref] = useBox<THREE.Mesh>(() => ({
    type: "Static",
    position,
    args: size,
  }))
  return (
    <Box ref={ref} args={size} position={position}>
      <HedgeMaterial />
    </Box>
  )
}

function Ground() {
  const [ref] = usePlane<THREE.Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }))

  return (
    <Plane ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} args={[150, 150]}>
      <GroundMaterial />
    </Plane>
  )
}

type FadeEffectProps = {
  isGameOver: boolean
}

function FadeEffect({ isGameOver }: FadeEffectProps) {
  const fadeRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null)

  useEffect(() => {
    if (isGameOver && fadeRef.current && fadeRef.current.material) {
      gsap.to(fadeRef.current.material.uniforms.opacity, {
        value: 1,
        duration: 2,
        ease: "power2.inOut",
      })
    }
  }, [isGameOver])

  return (
    <mesh position={[0, 0, -1]} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={fadeRef}
        transparent
        depthTest={false}
        uniforms={{
          opacity: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float opacity;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, opacity);
          }
        `}
      />
    </mesh>
  )
}

type PlayerProps = {
  isGameOver: boolean
  setPlayerPosition: (position: number[]) => void
  onWin: () => void
  hasLost: boolean
  initialPosition: number[]
}

function Player({ isGameOver, setPlayerPosition, onWin, hasLost, initialPosition }: PlayerProps) {
  const { camera } = useThree()
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: "Dynamic",
    position: [initialPosition[0], initialPosition[1], initialPosition[2]] as [number, number, number],
    args: [PLAYER_RADIUS],
  }))

  const [, get] = useKeyboardControls()

  useFrame(() => {
    if (!isGameOver) {
      const { forward, backward, left, right } = get()
      const direction = new THREE.Vector3()

      const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward))
      const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0)
      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(MOVEMENT_SPEED)
        .applyEuler(camera.rotation)

      api.velocity.set(direction.x, 0, direction.z)

      const position = ref.current.getWorldPosition(new THREE.Vector3())
      const mazeWidth = mazeLayout[0].length * CELL_SIZE
      const mazeHeight = mazeLayout.length * CELL_SIZE
      if (
        position.x < -mazeWidth / 2 ||
        position.x > mazeWidth / 2 ||
        position.z < -mazeHeight / 2 ||
        position.z > mazeHeight / 2
      ) {
        onWin()
      }
    } else {
      api.velocity.set(0, 0, 0)
    }

    ref.current.getWorldPosition(camera.position)
    camera.position.y = PLAYER_HEIGHT
    setPlayerPosition(camera.position.toArray())
  })

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(initialPosition[0], initialPosition[1], initialPosition[2])
      camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2])
      camera.position.y = PLAYER_HEIGHT
    }
  }, [initialPosition, camera, ref])

  return <mesh ref={ref} />
}

function findPath(start: number[], end: number[]) {
  const startNode = { x: Math.round(start[0] / CELL_SIZE), z: Math.round(start[2] / CELL_SIZE) }
  const endNode = { x: Math.round(end[0] / CELL_SIZE), z: Math.round(end[2] / CELL_SIZE) }

  const openSet = [startNode]
  const closedSet: (typeof startNode)[] = []
  const cameFrom: Record<string, typeof startNode> = {}
  const gScore: Record<string, number> = { [`${startNode.x},${startNode.z}`]: 0 }
  const fScore: Record<string, number> = { [`${startNode.x},${startNode.z}`]: heuristic(startNode, endNode) }

  while (openSet.length > 0) {
    let current = openSet.reduce((a, b) => (fScore[`${a.x},${a.z}`] < fScore[`${b.x},${b.z}`] ? a : b))

    if (current.x === endNode.x && current.z === endNode.z) {
      const path: number[][] = []
      while (current) {
        path.push([current.x * CELL_SIZE, 0, current.z * CELL_SIZE])
        current = cameFrom[`${current.x},${current.z}`]
      }
      return path.reverse()
    }

    openSet.splice(openSet.indexOf(current), 1)
    closedSet.push(current)

    const neighbors = [
      { x: current.x + 1, z: current.z },
      { x: current.x - 1, z: current.z },
      { x: current.x, z: current.z + 1 },
      { x: current.x, z: current.z - 1 },
    ]

    for (const neighbor of neighbors) {
      if (closedSet.some((node) => node.x === neighbor.x && node.z === neighbor.z)) continue
      if (isWall(neighbor.x * CELL_SIZE, neighbor.z * CELL_SIZE)) continue

      const tentativeGScore = gScore[`${current.x},${current.z}`] + 1

      if (!openSet.some((node) => node.x === neighbor.x && node.z === neighbor.z)) {
        openSet.push(neighbor)
      } else if (tentativeGScore >= gScore[`${neighbor.x},${neighbor.z}`]) {
        continue
      }

      cameFrom[`${neighbor.x},${neighbor.z}`] = current
      gScore[`${neighbor.x},${neighbor.z}`] = tentativeGScore
      fScore[`${neighbor.x},${neighbor.z}`] = gScore[`${neighbor.x},${neighbor.z}`] + heuristic(neighbor, endNode)
    }
  }

  return null
}

function heuristic(a: { x: number; z: number }, b: { x: number; z: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
}

type AICharacterProps = {
  playerPosition: number[]
  onCatchPlayer: () => void
  isGameOver: boolean
  gameStarted: boolean
  position: number[]
}

function AICharacter({ playerPosition, onCatchPlayer, isGameOver, gameStarted, position }: AICharacterProps) {
  const { scene: hotelScene } = useGLTF(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/guy-rQHtGAZuCkVuRp3Vhi5Wlw2tGuOxbo.glb",
  )
  const { animations } = useGLTF(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/run-IMT5ko1fHBy6fHfCRENf74yCy3KDiK.glb",
  )
  const { actions, mixer } = useAnimations(animations, hotelScene)
  const characterRef = useRef<THREE.Group>(null)
  const [path, setPath] = useState<number[][]>([])
  const { camera } = useThree()
  const [listener] = useState(() => new THREE.AudioListener())
  const [sound] = useState(() => new THREE.PositionalAudio(listener))

  const audioLoader = useMemo(() => new THREE.AudioLoader(), [])
  const audioUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio-SuYObN9rmzlwaVhFvOWWY1aaSSC7uw.mp3"

  useEffect(() => {
    if (actions["Armature|mixamo.com|Layer0"]) {
      actions["Armature|mixamo.com|Layer0"].play()
    }

    camera.add(listener)

    return () => {
      sound.stop()
      camera.remove(listener)
    }
  }, [actions, sound, camera, listener])

  useEffect(() => {
    if (gameStarted && !isGameOver) {
      audioLoader.load(audioUrl, (buffer) => {
        sound.setBuffer(buffer)
        sound.setRefDistance(10)
        sound.setVolume(1)
        sound.setLoop(true)
        sound.play()
      })
    }

    return () => {
      sound.stop()
    }
  }, [gameStarted, isGameOver, audioLoader, sound, audioUrl])

  useFrame((state, delta) => {
    if (characterRef.current && sound && !isGameOver) {
      mixer.update(delta)
      const currentPosition = characterRef.current.position
      const playerVector = new THREE.Vector3(...playerPosition)

      if (path.length === 0 || currentPosition.distanceTo(playerVector) > CHASE_DISTANCE) {
        const newPath = findPath([currentPosition.x, 0, currentPosition.z], playerPosition)
        if (newPath) setPath(newPath)
      }

      if (path.length > 0) {
        const targetPosition = new THREE.Vector3(...path[0])
        const direction = new THREE.Vector3().subVectors(targetPosition, currentPosition).normalize()
        const newPosition = currentPosition.clone().add(direction.multiplyScalar(AI_SPEED * delta))

        if (newPosition.distanceTo(targetPosition) < 0.1) {
          path.shift()
        }

        characterRef.current.position.copy(newPosition)
        characterRef.current.lookAt(targetPosition)
      }

      const aiMazeX = Math.floor((currentPosition.x + (mazeLayout[0].length * CELL_SIZE) / 2) / CELL_SIZE)
      const aiMazeZ = Math.floor((currentPosition.z + (mazeLayout.length * CELL_SIZE) / 2) / CELL_SIZE)
      const playerMazeX = Math.floor((playerVector.x + (mazeLayout[0].length * CELL_SIZE) / 2) / CELL_SIZE)
      const playerMazeZ = Math.floor((playerVector.z + (mazeLayout.length * CELL_SIZE) / 2) / CELL_SIZE)

      if (aiMazeX === playerMazeX && aiMazeZ === playerMazeZ && !isGameOver) {
        onCatchPlayer()
      }

      const distance = currentPosition.distanceTo(playerVector)
      const maxDistance = 20
      const volume = Math.max(0.5, Math.min(1, 1 - distance / maxDistance))
      sound.setVolume(volume)

      sound.position.copy(currentPosition)
    }
  })

  return (
    <primitive object={hotelScene} ref={characterRef} position={position} scale={[1, 1, 1]}>
      <primitive object={sound} />
    </primitive>
  )
}

function getRandomEmptyPosition(): number[] {
  let x, z
  do {
    x = Math.floor(Math.random() * (mazeLayout[0].length - 2)) + 1
    z = Math.floor(Math.random() * (mazeLayout.length - 2)) + 1
  } while (mazeLayout[z][x] !== 0 || (Math.abs(x) < 3 && Math.abs(z) < 3))

  return [(x - mazeLayout[0].length / 2) * CELL_SIZE, 0, (z - mazeLayout.length / 2) * CELL_SIZE]
}

function isWall(x: number, z: number) {
  const mazeX = Math.floor((x + (mazeLayout[0].length * CELL_SIZE) / 2) / CELL_SIZE)
  const mazeZ = Math.floor((z + (mazeLayout.length * CELL_SIZE) / 2) / CELL_SIZE)
  return mazeLayout[mazeZ] && mazeLayout[mazeZ][mazeX] === 1
}

const CirclePointsMaterial = {
  uniforms: {
    color: { value: new THREE.Color("white") },
    opacity: { value: 0.6 },
  },
  vertexShader: `
    attribute float size;
    varying vec3 vColor;
    void main() {
      vColor = vec3(1.0);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float opacity;
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      gl_FragColor = vec4(color * vColor, opacity);
    }
  `,
  transparent: true,
}

function Snow() {
  const count = 30000
  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150
      positions[i * 3 + 1] = Math.random() * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150
      sizes[i] = Math.random() * 0.08 + 0.04
    }

    return [positions, sizes]
  }, [count])

  const particlesRef = useRef<THREE.Points>(null)

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= 0.08
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 50
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial args={[CirclePointsMaterial]} transparent depthWrite={false} />
    </points>
  )
}

function TitleScreenMusic() {
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      return new Audio(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20(1)-WBaaqUWM8OrFK7H8xr5UBLzBHG7ibZ.mp3",
      )
    }
    return null
  })

  useEffect(() => {
    if (audio) {
      audio.loop = true
      audio.volume = 0.4
      audio.play().catch(() => {
        // Handle autoplay restrictions
      })
      return () => {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [audio])

  return null
}

type BackgroundMusicProps = {
  gameStarted: boolean
  isGameOver: boolean
}

function BackgroundMusic({ gameStarted, isGameOver }: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled-ooMw6BygICWxfHAwu8ZiR6liNWt0mQ.mp3",
      )
      audioRef.current.loop = true
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      if (gameStarted && !isGameOver) {
        audioRef.current.loop = true
        audioRef.current.volume = 0.4
        audioRef.current.play().catch(() => {
          // Handle autoplay restrictions
        })
      } else {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [gameStarted, isGameOver])

  return null
}

type PhantomChaseMusicProps = {
  isGameOver: boolean
}

function PhantomChaseMusic({ isGameOver }: PhantomChaseMusicProps) {
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      return new Audio(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Phantom%20Chase-NnoKn8Jdxb7NZ5TTrJuA6nYSlxSiGu.mp3",
      )
    }
    return null
  })

  useEffect(() => {
    if (audio && isGameOver) {
      audio.loop = true
      audio.volume = 0.4
      audio.play().catch(() => {
        // Handle autoplay restrictions
      })
    }
    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [audio, isGameOver])

  return null
}

type TimerProps = {
  onGameOver: () => void
}

function Timer({ onGameOver }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(90)

  const handleGameOver = useCallback(() => {
    onGameOver()
  }, [onGameOver])

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId)
          handleGameOver()
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timerId)
  }, [handleGameOver])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 text-[48px] font-[NightAOE] text-red-600 text-shadow-lg z-[1000]">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  )
}

type TitleScreenProps = {
  onStart: () => void
}

function TitleScreen({ onStart }: TitleScreenProps) {
  const { scene: hotelScene } = useGLTF("https://43fzijkfwg2zmvr5.public.blob.vercel-storage.com/models/hotel.glb")
  const { scene: mountainsScene } = useGLTF(
    "https://43fzijkfwg2zmvr5.public.blob.vercel-storage.com/rocky_mountains.glb",
  )
  const hotelRef = useRef<THREE.Group>(null)
  const mountainsRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        onStart()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onStart])

  return (
    <>
      <Environment
        files="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/night4-5uEo5n1aEFtW5SYwlMTy9bglR0dq6O.jpg"
        background
        blur={0.3}
      />
      <PerspectiveCamera makeDefault position={[0, 2, 8]} />
      <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.3} />
      <group ref={mountainsRef}>
        <primitive object={mountainsScene} scale={100} position={[-500, 469, -500]} />
      </group>
      <group ref={hotelRef}>
        <primitive object={hotelScene} scale={0.2} position={[0, -1.6, 0]} />
      </group>
      <TitleScreenMusic />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Snow />
    </>
  )
}

function Hotel() {
  const { scene } = useGLTF("https://43fzijkfwg2zmvr5.public.blob.vercel-storage.com/models/hotel.glb")
  return <primitive object={scene} scale={1} rotation={[0, Math.PI / 1.5, 0]} position={[-50, 0, 0]} />
}

function Mountain() {
  const { scene: mountainsScene } = useGLTF(
    "https://43fzijkfwg2zmvr5.public.blob.vercel-storage.com/rocky_mountains.glb",
  )
  return <primitive object={mountainsScene} scale={100} position={[-500, 469, -500]} />
}

export default function Component() {
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerPosition, setPlayerPosition] = useState([0, PLAYER_HEIGHT, 0])
  const [aiPosition, setAIPosition] = useState(getRandomEmptyPosition())
  const [hasWon, setHasWon] = useState(false)
  const [hasLost, setHasLost] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleGameOver = useCallback(() => {
    setIsGameOver(true)
    setHasLost(true)
  }, [])

  const handleRestart = useCallback(() => {
    setIsGameOver(false)
    setHasWon(false)
    setHasLost(false)
    setPlayerPosition([0, PLAYER_HEIGHT, 0])
    setAIPosition(getRandomEmptyPosition())
    setGameStarted(true)
  }, [])

  const handleWin = useCallback(() => {
    setHasWon(true)
    setIsGameOver(true)
  }, [])

  const handleStartGame = useCallback(() => {
    setShowInstructions(false)
    setGameStarted(true)
  }, [])

  const handleShowInstructions = useCallback(() => {
    setShowInstructions(true)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        handleRestart()
      }
    },
    [handleRestart],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!gameStarted) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === "Space") {
          handleShowInstructions()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted, handleShowInstructions])

  return (
    <>
      <style jsx global>{`
        @font-face {
          font-family: 'NightAOE';
          src: url('https://43fzijkfwg2zmvr5.public.blob.vercel-storage.com/fonts/HEROLD-dOWX54P8Kr6yxIgAmVurlcwj9htIxJ.otf') format('truetype');
        }
        @keyframes roll-credits {
          0% {
            transform: translate(0, calc(100dvh));
          }
          100% {
            transform: translate(0, -100dvh);
          }
        }
        .animate-credits {
          animation: roll-credits 20s linear forwards;
        }
        body {
          cursor: none;
        }
        canvas {
          cursor: none !important;
        }
        kbd {
          font-family: monospace;
          font-size: 0.9em;
        }
      `}</style>
      <div className="w-full h-screen overflow-hidden">
        {/* Title Screen Text */}
        {!gameStarted && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[256px] font-[NightAOE] pointer-events-none text-red-600 text-shadow-lg z-[1000]">
            666
          </div>
        )}

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[1003]">
            <div className="bg-gray-900 p-8 rounded-lg max-w-2xl mx-4 border border-red-600">
              <div className="text-4xl font-[NightAOE] text-red-600 mb-6 text-center">HOW TO SURVIVE</div>

              <div className="text-white space-y-4 text-lg">
                <div className="border-b border-gray-700 pb-4">
                  <div className="text-xl font-bold text-red-400 mb-2">🎯 OBJECTIVE</div>
                  <p>Escape the haunted maze before time runs out or the phantom catches you!</p>
                </div>

                <div className="border-b border-gray-700 pb-4">
                  <div className="text-xl font-bold text-red-400 mb-2">🎮 CONTROLS</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <kbd className="bg-gray-700 px-2 py-1 rounded">W/↑</kbd> Move Forward
                    </div>
                    <div>
                      <kbd className="bg-gray-700 px-2 py-1 rounded">S/↓</kbd> Move Backward
                    </div>
                    <div>
                      <kbd className="bg-gray-700 px-2 py-1 rounded">A/←</kbd> Move Left
                    </div>
                    <div>
                      <kbd className="bg-gray-700 px-2 py-1 rounded">D/→</kbd> Move Right
                    </div>
                    <div className="col-span-2">
                      <kbd className="bg-gray-700 px-2 py-1 rounded">Mouse</kbd> Look Around (Click to lock cursor)
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-700 pb-4">
                  <div className="text-xl font-bold text-red-400 mb-2">⚠️ DANGERS</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>The phantom AI hunts you using advanced pathfinding</li>
                    <li>You have 90 seconds to escape the larger maze</li>
                    <li>The phantom gets faster and smarter over time</li>
                    <li>Listen for audio cues - the phantom makes noise when close</li>
                  </ul>
                </div>

                <div>
                  <div className="text-xl font-bold text-red-400 mb-2">🏆 VICTORY</div>
                  <p className="text-sm">Reach the edge of the maze to escape and win!</p>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        <KeyboardControls
          map={[
            { name: "forward", keys: ["ArrowUp", "w", "W"] },
            { name: "backward", keys: ["ArrowDown", "s", "S"] },
            { name: "left", keys: ["ArrowLeft", "a", "A"] },
            { name: "right", keys: ["ArrowRight", "d", "D"] },
          ]}
        >
          <Canvas
            camera={{ fov: 75, near: 0.1, far: 1000, position: [0, PLAYER_HEIGHT, 0] }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
            }}
            dpr={[1, 2]}
            performance={{ min: 0.5 }}
          >
            {!gameStarted ? (
              <TitleScreen onStart={handleShowInstructions} />
            ) : (
              <Physics gravity={[0, -9.81, 0]} broadphase="SAP">
                <Environment
                  files="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/night4-5uEo5n1aEFtW5SYwlMTy9bglR0dq6O.jpg"
                  background
                  blur={0.3}
                />
                <ambientLight intensity={0.1} />
                <pointLight position={[0, HEDGE_HEIGHT * 2, 0]} intensity={0.4} />
                <PhysicalMaze />
                <Player
                  isGameOver={isGameOver}
                  setPlayerPosition={setPlayerPosition}
                  onWin={handleWin}
                  hasLost={hasLost}
                  initialPosition={playerPosition}
                />
                <AICharacter
                  playerPosition={playerPosition}
                  onCatchPlayer={handleGameOver}
                  isGameOver={isGameOver}
                  gameStarted={gameStarted}
                  position={aiPosition}
                />
                <Hotel />
                <Mountain />
                <Snow />
                {!isGameOver && <PointerLockControls />}
                {isGameOver && <FadeEffect isGameOver={isGameOver} />}
              </Physics>
            )}
          </Canvas>
        </KeyboardControls>

        {/* Title Screen Instructions */}
        {!gameStarted && !showInstructions && (
          <div className="absolute inset-x-0 bottom-10 flex flex-col items-center pointer-events-none uppercase space-y-4">
            <p className="text-white text-xl animate-pulse">Press Spacebar to View Instructions</p>
            <div className="text-gray-400 text-sm max-w-md text-center">
              <p>🎯 Escape the haunted maze before the phantom catches you</p>
              <p>⏰ You have 90 seconds to survive</p>
              <p>🎮 Use WASD or arrow keys to move, mouse to look around</p>
            </div>
          </div>
        )}

        {/* Audio Components */}
        <BackgroundMusic gameStarted={gameStarted} isGameOver={isGameOver} />

        {/* Timer */}
        {gameStarted && !isGameOver && <Timer onGameOver={handleGameOver} />}

        {/* Game Over Screens */}
        {isGameOver && (
          <>
            {!hasWon && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[72px] font-[NightAOE] text-red-600 text-shadow-lg z-[1000] flex flex-col items-center gap-8">
                <div>GAME OVER</div>
                <div className="text-2xl animate-pulse">Press Spacebar to Try Again</div>
              </div>
            )}
            {hasWon && (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[72px] font-[NightAOE] text-green-500 text-shadow-lg z-[1000] transition-opacity duration-500 opacity-100">
                  You Survived!
                </div>
                <div className="absolute inset-0 overflow-hidden z-[1001]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full max-w-4xl text-white font-sans text-center animate-credits">
                      <div className="text-6xl font-bold mb-8">Credits</div>
                      <div className="grid grid-cols-2 gap-8 text-3xl">
                        <div className="font-bold text-right">
                          <p className="mb-4">Created by</p>
                          <p className="mb-4">Enhanced by</p>
                          <p className="mb-4">Music by</p>
                          <p className="mb-4">Sound effects by</p>
                          <p className="mb-4">Skybox by</p>
                          <p className="mb-4">Textures by</p>
                          <p className="mb-4">Character model by</p>
                          <p className="mb-8">Hotel model by</p>
                        </div>
                        <div className="text-left">
                          <p className="mb-4">Sanskar Bhardwaj</p>
                          <p className="mb-4">v0 AI Assistant</p>
                          <p className="mb-4">SB</p>
                          <p className="mb-4">SB</p>
                          <p className="mb-4">SB</p>
                          <p className="mb-4">SB</p>
                          <p className="mb-4">SB</p>
                          <p className="mb-4">SB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            <PhantomChaseMusic isGameOver={isGameOver} />
          </>
        )}
      </div>
    </>
  )
}
