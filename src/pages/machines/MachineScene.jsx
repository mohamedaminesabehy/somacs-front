import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

export default function MachineScene({ status }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    // Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 5)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0x4488ff, 2)
    dirLight.position.set(5, 5, 5)
    scene.add(dirLight)
    const rimLight = new THREE.DirectionalLight(0x0052cc, 1.5)
    rimLight.position.set(-5, -2, -3)
    scene.add(rimLight)

    // Color by status
    const colorMap = {
      Actif: 0x10b981,
      'En panne': 0xef4444,
      Maintenance: 0xf59e0b,
      Inactif: 0x94a3b8,
    }
    const color = colorMap[status] || 0x0052cc

    // Main gear group
    const group = new THREE.Group()
    scene.add(group)

    // Torus (gear ring)
    const torusGeo = new THREE.TorusGeometry(1.2, 0.18, 16, 60)
    const torusMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.8,
      roughness: 0.2,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    group.add(torus)

    // Inner sphere
    const sphereGeo = new THREE.SphereGeometry(0.7, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0052cc,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: false,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    group.add(sphere)

    // Gear teeth
    const teethCount = 12
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2
      const toothGeo = new THREE.BoxGeometry(0.18, 0.35, 0.18)
      const toothMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 })
      const tooth = new THREE.Mesh(toothGeo, toothMat)
      tooth.position.set(Math.cos(angle) * 1.38, Math.sin(angle) * 1.38, 0)
      tooth.rotation.z = angle
      group.add(tooth)
    }

    // Wireframe overlay
    const wireGeo = new THREE.IcosahedronGeometry(0.72, 1)
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.08, transparent: true })
    const wire = new THREE.Mesh(wireGeo, wireMat)
    group.add(wire)

    // Floating particles
    const particleCount = 60
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({ color: 0x0052cc, size: 0.04, transparent: true, opacity: 0.5 })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // GSAP entrance animation
    gsap.from(group.scale, { x: 0, y: 0, z: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' })
    gsap.from(group.rotation, { y: -Math.PI * 2, duration: 1.8, ease: 'power3.out' })

    // Mouse parallax
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    el.addEventListener('mousemove', onMouseMove)

    // Animation loop
    let frameId
    const clock = new THREE.Clock()
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      group.rotation.y = t * 0.4 + mouse.x * 0.3
      group.rotation.x = Math.sin(t * 0.3) * 0.15 + mouse.y * 0.2
      sphere.rotation.y = -t * 0.8
      particles.rotation.y = t * 0.05
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [status])

  return <div ref={mountRef} className="w-full h-full" />
}