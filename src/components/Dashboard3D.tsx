import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Filter, ChevronUp, ChevronDown, Gamepad2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Node as NodeType, TooltipData, AnimationSettings, DashboardMode } from '../types';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Header } from './Header';
import { Legend } from './Legend';
import { LiveStatus } from './LiveStatus';
import { SettingsPanel } from './SettingsPanel';
import { ChartModal } from './ChartModal';
import { Tooltip } from './Tooltip';
import { ComparisonPanel } from './ComparisonPanel';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

interface Dashboard3DProps {
  mode: DashboardMode;
  onModeSwitch: (mode: DashboardMode) => void;
  viewMode?: '2d' | '3d' | 'vr';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr') => void;
}

export const Dashboard3D: React.FC<Dashboard3DProps> = ({
  mode,
  onModeSwitch,
  viewMode = '3d',
  onViewModeSwitch
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('blotchain_refresh_interval');
    return saved ? parseInt(saved, 10) : 30000;
  });

  const { nodes, connections, loading, error, lastUpdate, refetch } = useRealTimeData(mode, refreshInterval);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeChartNode, setActiveChartNode] = useState<NodeType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState<boolean>(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(true);

  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(() => {
    const saved = localStorage.getItem('blotchain_animation_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      particleSpeed: 1,
      breathingIntensity: 1
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData>({
    node: {} as NodeType,
    x: 0,
    y: 0,
    visible: false
  });

  // Calculate uniform 3D spherical positions for the nodes
  const nodes3D = useMemo(() => {
    if (nodes.length === 0) return [];

    // Separate nodes into different types to form hierarchical 3D shells
    const hubs = nodes.filter(n => n.isHub);
    const cex = nodes.filter(n => n.category === 'CEX' && !n.isHub);
    const others = nodes.filter(n => !n.isHub && n.category !== 'CEX');

    const result: Array<NodeType & { x3d: number; y3d: number; z3d: number }> = [];

    // 1. Core Hubs: place near the center in a small cluster
    hubs.forEach((node, idx) => {
      const angle = (idx / hubs.length) * Math.PI * 2;
      result.push({
        ...node,
        x3d: Math.cos(angle) * 5,
        y3d: Math.sin(angle) * 3,
        z3d: (idx % 2 === 0 ? 1 : -1) * 2
      });
    });

    // 2. CEX nodes: place in an intermediate shell
    cex.forEach((node, idx) => {
      const u = idx / cex.length;
      const theta = u * Math.PI * 2.0;
      const phi = Math.acos(2.0 * u - 1.0) - Math.PI / 2.0;
      const radius = 15;
      result.push({
        ...node,
        x3d: radius * Math.cos(phi) * Math.cos(theta),
        y3d: radius * Math.sin(phi),
        z3d: radius * Math.cos(phi) * Math.sin(theta)
      });
    });

    // 3. Others (Altcoins, Stablecoins, Protocols, AMMs): outer shell using a uniform Fibonacci sphere
    const count = others.length;
    const phiGold = Math.PI * (3.0 - Math.sqrt(5.0)); // golden angle in radians

    others.forEach((node, idx) => {
      const radius = 28 + (idx % 3) * 2; // subtle radial variance to prevent perfect alignment overlap
      const y = 1.0 - (idx / (count - 1)) * 2.0; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1.0 - y * y); // radius at y
      const theta = phiGold * idx; // golden angle increment

      result.push({
        ...node,
        x3d: radius * radiusAtY * Math.cos(theta),
        y3d: radius * y,
        z3d: radius * radiusAtY * Math.sin(theta)
      });
    });

    return result;
  }, [nodes]);

  // Categories helper
  const categories = useMemo(() => {
    const cats = new Set(nodes.filter(n => !n.isHub).map(n => n.category));
    return ['All', ...Array.from(cats)].sort();
  }, [nodes]);

  // Filtered nodes in 3D
  const filteredNodes3D = useMemo(() => {
    return nodes3D.map(node => {
      const isVisible = categoryFilter === 'All' || node.category === categoryFilter || node.isHub;
      return {
        ...node,
        opacity3d: isVisible ? 1.0 : 0.15
      };
    });
  }, [nodes3D, categoryFilter]);

  const filteredNodes3DMap = useMemo(() => {
    return new Map(filteredNodes3D.map(n => [n.id, n]));
  }, [filteredNodes3D]);

  const selectedNodeData = useMemo(() => {
    return nodes.filter(n => selectedNodes.has(n.id));
  }, [nodes, selectedNodes]);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const toggleComparison = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        if (newSet.size >= 2) {
          const arr = Array.from(newSet);
          return new Set([arr[1], nodeId]);
        }
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const exportToJson = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      mode,
      viewMode: '3d',
      nodes,
      connections
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blotchain-3d-export-${mode}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mode, nodes, connections]);

  const exportToPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `blotchain-3d-snapshot-${mode}-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  }, [mode]);

  // Set up three.js scene inside useEffect
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || filteredNodes3D.length === 0) return;

    // Get real canvas dimension
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene with deep background and subtle fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // slate-900
    scene.fog = new THREE.FogExp2('#0f172a', 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 55);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Lights
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.5); // soft slate ambient
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#ffffff', 2, 120);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight('#3b82f6', 1); // blue side light
    dirLight1.position.set(30, 20, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight('#8b5cf6', 1); // purple counter-light
    dirLight2.position.set(-30, -20, -20);
    scene.add(dirLight2);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 150;
    controls.minDistance = 5;

    // Shared sphere geometry
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);

    // Map to hold references to Three.js Object3D for raycasting and hover
    const nodeMeshes: THREE.Group[] = [];
    const nodeIdToMesh = new Map<string, THREE.Group>();

    // Dynamic scale helper based on node.size
    const getNodeRadius = (size: number) => size / 22;

    // Texture creation helper for dynamic high-quality sprites
    const createTextTexture = (name: string, category: string, isHub: boolean, opacity: number) => {
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 256;
      textCanvas.height = 128;
      const ctx = textCanvas.getContext('2d');
      if (!ctx) return null;

      // Transparent background
      ctx.clearRect(0, 0, 256, 128);

      // Label background bubble
      ctx.fillStyle = `rgba(15, 23, 42, ${0.85 * opacity})`;
      ctx.strokeStyle = `rgba(71, 85, 105, ${0.6 * opacity})`;
      ctx.lineWidth = 2;

      const rectX = 16;
      const rectY = 16;
      const rectW = 224;
      const rectH = 80;
      const radius = 12;

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(rectX + radius, rectY);
      ctx.lineTo(rectX + rectW - radius, rectY);
      ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
      ctx.lineTo(rectX + rectW, rectY + rectH - radius);
      ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
      ctx.lineTo(rectX + radius, rectY + rectH);
      ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
      ctx.lineTo(rectX, rectY + radius);
      ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw primary text (Name)
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 128, 44);

      // Draw secondary text (Category)
      ctx.fillStyle = `rgba(148, 163, 184, ${0.9 * opacity})`; // slate-400
      ctx.font = '500 16px system-ui, sans-serif';
      ctx.fillText(isHub ? 'Hub' : category, 128, 76);

      const texture = new THREE.CanvasTexture(textCanvas);
      texture.minFilter = THREE.LinearFilter;
      return texture;
    };

    // Render Node Spheres & Text Sprites
    filteredNodes3D.forEach(node => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(node.x3d, node.y3d, node.z3d);
      nodeGroup.userData = { nodeId: node.id, nodeData: node };

      const r = getNodeRadius(node.size);

      // Material with glowing emissive category brand color
      const isSelected = selectedNodes.has(node.id);
      const isHighlighted = selectedNodes.size === 0 || selectedNodes.has(node.id);
      const finalOpacity = node.opacity3d * (isHighlighted ? 1.0 : 0.25);

      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: finalOpacity,
        emissive: new THREE.Color(node.color),
        emissiveIntensity: isSelected ? 1.0 : (node.isHub ? 0.3 : 0.15)
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.scale.setScalar(r);
      nodeGroup.add(sphereMesh);

      // Dynamic Sprite Label
      const labelTexture = createTextTexture(node.name, node.category, !!node.isHub, finalOpacity);
      if (labelTexture) {
        const spriteMat = new THREE.SpriteMaterial({
          map: labelTexture,
          transparent: true,
          opacity: finalOpacity,
          depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        // Position label sprite directly above the node sphere, taking sphere radius into account
        sprite.position.set(0, r + 1.8, 0);
        sprite.scale.set(4.5, 2.25, 1);
        nodeGroup.add(sprite);
      }

      scene.add(nodeGroup);
      nodeMeshes.push(nodeGroup);
      nodeIdToMesh.set(node.id, nodeGroup);
    });

    // Create Connection Lines (3D paths)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#475569', // slate-600
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    const activeLineMaterial = new THREE.LineBasicMaterial({
      color: '#3b82f6', // blue-500
      transparent: true,
      opacity: 0.85,
      linewidth: 2, // only works on some platforms, standard fallback exists
      depthWrite: false
    });

    interface ConnectionRef {
      line: THREE.Line;
      particle: THREE.Mesh;
      speed: number;
      progress: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
    }

    const connectionRefs: ConnectionRef[] = [];
    const particleGeo = new THREE.SphereGeometry(0.12, 16, 16);

    connections.forEach(conn => {
      const srcNode = filteredNodes3DMap.get(conn.source);
      const tgtNode = filteredNodes3DMap.get(conn.target);
      if (!srcNode || !tgtNode) return;

      const p1 = new THREE.Vector3(srcNode.x3d, srcNode.y3d, srcNode.z3d);
      const p2 = new THREE.Vector3(tgtNode.x3d, tgtNode.y3d, tgtNode.z3d);

      // Implement the 20% Connection Guide Lines Collision Buffer
      const vector = new THREE.Vector3().subVectors(p2, p1);
      const totalLen = vector.length();

      const r1 = getNodeRadius(srcNode.size) * 1.20; // 20% protective offset
      const r2 = getNodeRadius(tgtNode.size) * 1.20; // 20% protective offset

      if (totalLen <= r1 + r2) return; // safety, avoid degenerate lines

      // Safe connection path offset bounds
      const p1Offset = p1.clone().addScaledVector(vector.clone().normalize(), r1);
      const p2Offset = p2.clone().addScaledVector(vector.clone().normalize(), -(r2));

      // Draw connection line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1Offset, p2Offset]);
      const isConnectionHighlighted = selectedNodes.size === 0 || selectedNodes.has(conn.source) || selectedNodes.has(conn.target);
      const line = new THREE.Line(lineGeo, isConnectionHighlighted ? activeLineMaterial : lineMaterial);
      scene.add(line);

      // Floating flow animation particle
      const flowColor = conn.direction === 'in' ? '#22c55e' : '#f43f5e';
      const particleMat = new THREE.MeshBasicMaterial({
        color: flowColor,
        transparent: true,
        opacity: isConnectionHighlighted ? 0.9 : 0.25
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(p1Offset);
      scene.add(particle);

      connectionRefs.push({
        line,
        particle,
        speed: 0.003 * animationSettings.particleSpeed * (Math.random() * 0.5 + 0.75),
        progress: Math.random(), // random start offset for fluid continuous flow visual
        start: p1Offset,
        end: p2Offset
      });
    });

    // Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredNodeGroup: THREE.Group | null = null;
    const baseHoveredScale = new THREE.Vector3(1, 1, 1);

    const getRaycastIntersect = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Find children of our node meshes (the sphere mesh)
      const targets = nodeMeshes.map(group => group.children[0]);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        // Return parent Group representing the Node
        return intersects[0].object.parent as THREE.Group;
      }
      return null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const intersectedGroup = getRaycastIntersect(e.clientX, e.clientY);

      if (intersectedGroup) {
        if (hoveredNodeGroup !== intersectedGroup) {
          // Reset previous hovered state
          if (hoveredNodeGroup) {
            hoveredNodeGroup.children[0].scale.copy(baseHoveredScale);
          }

          hoveredNodeGroup = intersectedGroup;
          const sphereMesh = hoveredNodeGroup.children[0];
          baseHoveredScale.copy(sphereMesh.scale);
          sphereMesh.scale.multiplyScalar(1.25); // increase hover scale

          // Show Tooltip
          const nodeData = hoveredNodeGroup.userData.nodeData as NodeType;
          setTooltip({
            node: nodeData,
            x: e.clientX,
            y: e.clientY - 15,
            visible: true
          });
          document.body.style.cursor = 'pointer';
        } else {
          // Keep tooltip following the cursor
          setTooltip(prev => ({
            ...prev,
            x: e.clientX,
            y: e.clientY - 15
          }));
        }
      } else {
        if (hoveredNodeGroup) {
          hoveredNodeGroup.children[0].scale.copy(baseHoveredScale);
          hoveredNodeGroup = null;
          setTooltip(prev => ({ ...prev, visible: false }));
          document.body.style.cursor = 'default';
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const clickedGroup = getRaycastIntersect(e.clientX, e.clientY);
      if (clickedGroup) {
        const nodeData = clickedGroup.userData.nodeData as NodeType;

        // Trigger click selection/cascade
        if (nodeData.isHub) {
          toggleComparison(nodeData.id);
        } else {
          setActiveChartNode(nodeData);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(80, 40, '#1e293b', '#0f172a');
    gridHelper.position.y = -18;
    scene.add(gridHelper);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Orbit control updates
      controls.update();

      const time = clock.getElapsedTime();

      // Node breathing animation and subtle floating
      nodeMeshes.forEach(group => {
        const node = group.userData.nodeData as NodeType;
        const sphereMesh = group.children[0] as THREE.Mesh;
        const sphereMat = sphereMesh.material as THREE.MeshStandardMaterial;

        // Subtle floating movement
        const floatOffset = Math.sin(time * 0.8 + node.size) * 0.05;
        group.position.y = node.y3d + floatOffset;

        // Breathing animation in emissive intensity
        if (animationSettings.enabled) {
          const breathe = Math.sin(time * 1.5 + node.size) * 0.5 + 0.5; // 0 to 1
          sphereMat.emissiveIntensity = (selectedNodes.has(node.id) ? 1.0 : (node.isHub ? 0.3 : 0.15)) +
            breathe * 0.12 * animationSettings.breathingIntensity;
        }
      });

      // Update moving particles
      if (animationSettings.enabled) {
        connectionRefs.forEach(ref => {
          ref.progress += ref.speed;
          if (ref.progress > 1) ref.progress = 0;
          ref.particle.position.lerpVectors(ref.start, ref.end, ref.progress);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      resizeObserver.disconnect();
      controls.dispose();

      // Dispose all geometries, materials, and textures in scene to prevent WebGL leaks
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(mat => {
            if ('map' in mat && mat.map) {
              (mat.map as THREE.Texture).dispose();
            }
            mat.dispose();
          });
        }
      });

      sphereGeo.dispose();
      particleGeo.dispose();
      lineMaterial.dispose();
      activeLineMaterial.dispose();

      renderer.dispose();
      scene.clear();
      document.body.style.cursor = 'default';
    };
  }, [filteredNodes3D, filteredNodes3DMap, connections, selectedNodes, animationSettings, toggleComparison]);

  if (loading && nodes.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && nodes.length === 0) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 overflow-hidden flex flex-col relative">
      <Header
        lastUpdate={lastUpdate}
        mode={mode}
        onModeSwitch={onModeSwitch}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedCount={selectedNodes.size}
        onClearSelection={clearSelection}
        viewMode={viewMode}
        onViewModeSwitch={onViewModeSwitch}
      />

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block focus:outline-none"
        />

        {loading && nodes.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse z-20">
            UPDATING LIVE DATA...
          </div>
        )}

        {/* 3D Instructions Overlay */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 select-none">
          {isControlsCollapsed ? (
            <button
              onClick={() => setIsControlsCollapsed(false)}
              className="flex items-center gap-1.5 bg-gray-900/85 hover:bg-gray-800/90 text-gray-300 hover:text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-700/80 text-xs font-semibold shadow-md transition-all cursor-pointer"
              title="Show 3D controls"
            >
              <Gamepad2 size={13} className="text-indigo-400" />
              <span>3D Controls</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>
          ) : (
            <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg p-2.5 max-w-[220px] shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-gray-800">
                <div className="flex items-center gap-1.5">
                  <Gamepad2 size={13} className="text-indigo-400" />
                  <span className="text-white text-[11px] font-bold">3D CONTROLS</span>
                </div>
                <button
                  onClick={() => setIsControlsCollapsed(true)}
                  className="p-0.5 hover:text-white rounded hover:bg-slate-800 text-gray-400 transition-colors cursor-pointer"
                  title="Collapse controls"
                >
                  <ChevronUp size={13} />
                </button>
              </div>
              <div className="space-y-1 text-gray-300 text-[10px] font-medium">
                <p>• Rotate: Left-click + Drag</p>
                <p>• Zoom: Scroll wheel</p>
                <p>• Pan: Right-click + Drag</p>
                <p>• Click node: View history chart</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Controls Overlays */}
        <LiveStatus
          nodeCount={nodes.length}
          connectionCount={connections.length}
          mode={mode}
          className="absolute top-4 right-4 z-10"
        />

        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-24px)] pointer-events-none">
          <div className="pointer-events-auto w-fit">
            <Legend
              mode={mode}
              className="bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-lg p-2.5 shadow-lg"
            />
          </div>

          <div className="pointer-events-auto w-fit max-w-full">
            {isFilterCollapsed ? (
              <button
                onClick={() => setIsFilterCollapsed(false)}
                className="flex items-center gap-1.5 bg-gray-900/90 hover:bg-gray-800/90 text-gray-300 hover:text-white backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-700/80 text-xs font-medium transition-all shadow-md cursor-pointer select-none"
                title="Filter by category"
              >
                <Filter size={13} className="text-blue-400" />
                <span>Filter: <span className="text-white font-semibold">{categoryFilter}</span></span>
                <ChevronUp size={13} className="text-gray-400 ml-0.5" />
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 bg-gray-900/95 backdrop-blur-md p-2 rounded-lg border border-gray-700 shadow-xl max-w-full">
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-blue-400" />
                    <span className="font-semibold text-gray-300">Category Filter</span>
                  </div>
                  <button
                    onClick={() => setIsFilterCollapsed(true)}
                    className="p-0.5 hover:text-white rounded hover:bg-slate-800 text-gray-400 transition-colors cursor-pointer"
                    title="Collapse filter"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-md transition-all whitespace-nowrap font-medium ${
                        categoryFilter === cat
                          ? mode === 'crypto' ? 'bg-blue-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tooltip data={tooltip} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        animationSettings={animationSettings}
        setAnimationSettings={setAnimationSettings}
        onExportJson={exportToJson}
        onExportPng={exportToPng}
      />

      <ComparisonPanel
        selectedNodes={selectedNodeData}
        onClear={clearSelection}
      />

      <ChartModal
        node={activeChartNode}
        onClose={() => setActiveChartNode(null)}
        onAddToComparison={toggleComparison}
      />
    </div>
  );
};
