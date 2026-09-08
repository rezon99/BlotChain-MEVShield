// src/components/ThreatVisualizer3D.tsx
import React, { useEffect, useRef, useState, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IntentThreatPayload, ThreatNode } from '../types/mev';
import { ChevronDown, ChevronUp, ShieldAlert, Info, Tag, DollarSign } from 'lucide-react';

export interface ThreatVisualizer3DProps {
  payload: IntentThreatPayload | null;
  riskThreshold?: number;          // Default 0.7
  enableOrbitControls?: boolean;   // Default true
  onNodeSelect?: (node: ThreatNode | null) => void;
  selectedNodeId?: string | null;
}

/**
 * Adaptive circular positioning of nodes with subtle alternating Z-offset
 */
const computePositions = (count: number, radius = 5.5) => {
  if (count <= 1) return [{ x: 0, y: 0, z: 0 }];
  const positions: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.65,
      z: (i % 2 === 0 ? 1 : -1) * 1.3,
    });
  }
  return positions;
};

export const ThreatVisualizer3D = memo<ThreatVisualizer3DProps>(({
  payload,
  riskThreshold = 0.7,
  enableOrbitControls = true,
  onNodeSelect,
  selectedNodeId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeGroupRef = useRef<THREE.Group | null>(null);
  const connectionsGroupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<{
    [id: string]: {
      mesh: THREE.Mesh;
      material: THREE.MeshStandardMaterial;
      isPulsing: boolean;
      nodeData: ThreatNode;
    };
  }>({});
  const [activeHUD, setActiveHUD] = useState<IntentThreatPayload['riskAssessment'] | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ node: ThreatNode; x: number; y: number } | null>(null);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(true);

  // --- 1. Scene Initialization (Mount only) ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // WebGL capability check
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      setWebglError('WebGL is not supported or is disabled in your browser.');
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16');
    scene.fog = new THREE.FogExp2(0x090d16, 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 14);
    cameraRef.current = camera;

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    backLight.position.set(-6, -2, -6);
    scene.add(backLight);

    const redAccentLight = new THREE.PointLight(0xFF0055, 0.8, 20);
    redAccentLight.position.set(0, -4, 2);
    scene.add(redAccentLight);

    // Subtle background grid floor for spatial orientation
    const gridHelper = new THREE.GridHelper(26, 26, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // Connections & Nodes Groups
    const connectionsGroup = new THREE.Group();
    scene.add(connectionsGroup);
    connectionsGroupRef.current = connectionsGroup;

    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    nodeGroupRef.current = nodeGroup;

    // OrbitControls
    if (enableOrbitControls) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.autoRotate = false;
      controls.minDistance = 4;
      controls.maxDistance = 35;
      controls.target.set(0, 0, 0);
      controls.update();
      controlsRef.current = controls;
    }

    // --- Raycasting for hover & click ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const hitMesh = intersects[0].object as THREE.Mesh;
        const entry = Object.values(meshesRef.current).find(m => m.mesh === hitMesh);
        if (entry) {
          setHoveredNode({
            node: entry.nodeData,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredNode(null);
      }
    };

    const handlePointerClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const entry = Object.values(meshesRef.current).find(m => m.mesh === hitMesh);
        if (entry && onNodeSelect) {
          onNodeSelect(entry.nodeData);
        }
      } else {
        if (onNodeSelect) {
          onNodeSelect(null);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handlePointerClick);

    // --- Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate pulsing or breathing nodes
      Object.values(meshesRef.current).forEach(({ mesh, material, isPulsing }) => {
        if (isPulsing) {
          const scale = 1 + Math.sin(elapsed * 7.5) * 0.18;
          mesh.scale.set(scale, scale, scale);
          material.emissiveIntensity = 0.5 + Math.sin(elapsed * 7.5) * 0.5;
        } else {
          const scale = 1 + Math.sin(elapsed * 2.0) * 0.04;
          mesh.scale.set(scale, scale, scale);
        }
      });

      // Subtle slow rotation of the whole node group
      if (nodeGroup) {
        nodeGroup.rotation.y = Math.sin(elapsed * 0.15) * 0.08;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // --- Cleanup on unmount ---
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handlePointerClick);

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      // Dispose grid helper
      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
    };
  }, [enableOrbitControls, onNodeSelect]);

  // --- 2. Update Nodes & Connections on payload change ---
  useEffect(() => {
    const group = nodeGroupRef.current;
    const connGroup = connectionsGroupRef.current;
    if (!group || !connGroup) return;

    // Dispose old node meshes & materials to prevent GPU leaks
    while (group.children.length > 0) {
      const child = group.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      group.remove(child);
    }

    // Dispose old connection lines
    while (connGroup.children.length > 0) {
      const child = connGroup.children[0];
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      connGroup.remove(child);
    }

    meshesRef.current = {};

    // Prepare node data
    const defaultNodes: ThreatNode[] = [
      {
        id: 'node_victim',
        label: 'Victim Wallet',
        type: 'WALLET',
        threatColor: '#22c55e',
        isPulsing: false,
        details: { ensName: 'trader.eth', address: '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f' }
      },
      { id: 'node_mempool', label: 'Public Mempool', type: 'TRANSACTION', threatColor: '#eab308', isPulsing: false },
      { id: 'node_bot', label: 'MEV Bot #0x92a', type: 'WALLET', threatColor: '#FF0055', isPulsing: true },
      { id: 'node_pool', label: 'Uniswap V3 (ETH/USDC)', type: 'DEX_POOL', threatColor: '#f97316', isPulsing: true, details: { ensName: 'uniswap-v3-pool.eth' } },
      { id: 'node_builder', label: 'Block Builder #7', type: 'CONTRACT', threatColor: '#3b82f6', isPulsing: false },
    ];

    const nodes =
      payload?.visualization?.nodes && payload.visualization.nodes.length > 0
        ? payload.visualization.nodes
        : defaultNodes;

    const positions = computePositions(nodes.length);

    // Create node meshes
    nodes.forEach((node, index) => {
      const isSelected = selectedNodeId === node.id;
      const radius = node.type === 'DEX_POOL' ? 0.95 : node.type === 'WALLET' ? 0.75 : 0.65;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);

      // Default to #FF0055 for critical threat nodes
      const effectiveColor = node.isPulsing ? (node.threatColor || '#FF0055') : (node.threatColor || '#22c55e');
      const color = new THREE.Color(effectiveColor);

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.65,
        emissive: isSelected ? new THREE.Color('#38bdf8') : color,
        emissiveIntensity: isSelected ? 0.95 : node.isPulsing ? 0.85 : 0.25,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const pos = positions[index] || { x: 0, y: 0, z: 0 };
      mesh.position.set(pos.x, pos.y, pos.z);
      group.add(mesh);

      // Add a glowing ring around pulsing (threat) nodes
      if (node.isPulsing) {
        const ringGeo = new THREE.RingGeometry(radius * 1.35, radius * 1.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        mesh.add(ringMesh);
      }

      meshesRef.current[node.id] = {
        mesh,
        material,
        isPulsing: !!node.isPulsing,
        nodeData: node
      };
    });

    // Create interconnected data flow lines between consecutive nodes
    if (nodes.length > 1) {
      for (let i = 0; i < nodes.length; i++) {
        const nextIdx = (i + 1) % nodes.length;
        const p1 = positions[i];
        const p2 = positions[nextIdx];

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3(p2.x, p2.y, p2.z)
        ]);

        const hasThreat = nodes[i].isPulsing || nodes[nextIdx].isPulsing;
        const lineMaterial = new THREE.LineBasicMaterial({
          color: hasThreat ? 0xFF0055 : 0x38bdf8,
          transparent: true,
          opacity: hasThreat ? 0.7 : 0.3,
          linewidth: 1
        });

        const line = new THREE.Line(lineGeometry, lineMaterial);
        connGroup.add(line);
      }
    }

    // Update active HUD
    setActiveHUD(payload?.riskAssessment || null);
  }, [payload, selectedNodeId]);

  // --- WebGL Error Fallback ---
  if (webglError) {
    return (
      <div className="relative w-full h-[600px] bg-slate-950 rounded-xl border border-red-500/80 flex items-center justify-center text-white shadow-2xl p-6">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-red-300 mb-2">WebGL Initialization Error</h3>
          <p className="text-xs text-slate-300 mb-3">{webglError}</p>
          <p className="text-[11px] text-slate-400">
            Please verify that hardware acceleration is enabled in your browser settings and that your graphics drivers are up to date.
          </p>
        </div>
      </div>
    );
  }

  const riskScore = activeHUD?.riskScore ?? 0;
  const detectedThreats = activeHUD?.detectedThreats ?? [];
  const actionTaken = activeHUD?.actionTaken || 'Mitigated';

  return (
    <div className="relative w-full h-[600px] bg-[#090d16] overflow-hidden rounded-xl border border-slate-800 shadow-2xl select-none">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-3 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl text-white text-xs"
          style={{ left: hoveredNode.x, top: hoveredNode.y }}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: hoveredNode.node.threatColor || '#22c55e' }}
            />
            {hoveredNode.node.label}
          </div>
          {hoveredNode.node.details?.ensName && (
            <div className="text-[11px] text-indigo-300 font-mono font-semibold flex items-center gap-1 mt-0.5">
              <Tag size={11} className="text-indigo-400" />
              <span>{hoveredNode.node.details.ensName}</span>
            </div>
          )}
          <div className="text-[10px] text-slate-400 capitalize mt-0.5">
            Type: {hoveredNode.node.type.toLowerCase()}
            {hoveredNode.node.isPulsing && (
              <span className="text-red-400 font-semibold ml-1.5">• High Threat</span>
            )}
          </div>
        </div>
      )}

      {/* Built-in Collapsible Legend (Collapsed by default per user guidelines) */}
      <div className="absolute bottom-4 left-4 z-10">
        {isLegendCollapsed ? (
          <button
            onClick={() => setIsLegendCollapsed(false)}
            className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-900/90 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all cursor-pointer"
            title="Show MEV legend"
          >
            <Info size={13} className="text-blue-400" />
            <span>Legend</span>
            <ChevronUp size={13} className="text-slate-400" />
          </button>
        ) : (
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/70 p-3 rounded-lg text-white text-xs space-y-1.5 shadow-2xl min-w-[200px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Info size={12} className="text-blue-400" /> Threat Legend
              </span>
              <button
                onClick={() => setIsLegendCollapsed(true)}
                className="p-0.5 hover:text-white text-slate-400 transition-colors"
                title="Collapse legend"
              >
                <ChevronDown size={13} />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-slate-300">Low Risk / Safe</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-slate-300">Medium Risk / Mempool</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF0055] animate-pulse" />
              <span className="text-slate-300">Critical Threat (#FF0055)</span>
            </div>
            <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              Left Click: Rotate • Scroll: Zoom • Click node to inspect
            </div>
          </div>
        )}
      </div>

      {/* Threat HUD (Shown when risk >= threshold) */}
      {activeHUD && riskScore >= riskThreshold && (
        <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md border border-red-500/60 p-4 rounded-xl shadow-2xl text-white max-w-xs z-10 transition-all">
          <div className="flex items-center space-x-2 text-red-400 font-bold mb-1.5">
            <ShieldAlert size={18} className="text-red-400 animate-bounce" />
            <span className="tracking-wide text-xs uppercase">Threat Detected</span>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            {(payload?.ensName || payload?.userAddress) && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ENS Target:</span>
                <span className="font-mono font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800 px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                  <Tag size={10} className="text-indigo-400" />
                  {payload.ensName || payload.userAddress}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk Score:</span>
              <span className="font-mono font-bold text-red-400 bg-red-950/60 border border-red-900 px-1.5 py-0.5 rounded">
                {(riskScore * 100).toFixed(0)}% ({riskScore.toFixed(2)})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Automated Action:</span>
              <span className="text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded text-[11px]">
                {actionTaken}
              </span>
            </div>

            {payload?.meta?.protectionFeeUsdc !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Arc USDC Settlement:</span>
                <span className="text-sky-300 font-mono font-semibold bg-sky-950/40 border border-sky-800/60 px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">
                  <DollarSign size={10} className="text-sky-400" />
                  {payload.meta.protectionFeeUsdc.toFixed(2)} USDC
                </span>
              </div>
            )}

            {detectedThreats.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">
                  Detected Vectors:
                </div>
                <ul className="list-disc list-inside text-red-300 text-[11px] space-y-0.5">
                  {detectedThreats.map((threat, idx) => (
                    <li key={idx} className="truncate" title={threat}>{threat}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ThreatVisualizer3D.displayName = 'ThreatVisualizer3D';
