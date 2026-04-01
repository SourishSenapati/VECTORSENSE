import React, { useState } from 'react';

const SPECS = [
  {
    category: 'Airframe',
    items: [
      { name: 'Configuration',   value: 'Hexacopter — 6-rotor, coaxial-redundant' },
      { name: 'Frame Material',  value: 'T700 Carbon Fibre + Magnesium Alloy Arms' },
      { name: 'Diagonal Span',   value: '870 mm motor-to-motor' },
      { name: 'Max Takeoff Wt.', value: '4.8 kg including full sensor payload' },
      { name: 'Wind Resistance', value: 'Level 7 — 15 m/s sustained gust' },
      { name: 'IP Rating',       value: 'IP54 — Industrial dust and splash proof' },
    ],
  },
  {
    category: 'Propulsion',
    items: [
      { name: 'Motors (x6)',    value: 'Brushless 380 KV, 2806 stator, CW/CCW paired' },
      { name: 'Propellers',     value: '13x4.4 in carbon-fibre foldable, 3-blade' },
      { name: 'ESCs',           value: '45 A BLHeli32, DShot1200 protocol' },
      { name: 'Battery',        value: '6S LiPo 22000 mAh Smart Battery' },
      { name: 'Flight Time',    value: '38 min hover / 24 min full sensor load' },
      { name: 'Max Speed',      value: '72 km/h forward, 8 m/s vertical climb' },
    ],
  },
  {
    category: 'Sensors',
    items: [
      { name: 'Gas Detection',  value: 'MQ-2 / MQ-135 array — CH4, CO, H2S, VOC' },
      { name: 'Thermal Camera', value: 'FLIR Lepton 3.5 — 160x120 at 8.7 um IR' },
      { name: 'LiDAR',          value: 'Velodyne VLP-16 — 360 deg / 100 m / 300k pt/s' },
      { name: 'Acoustic NDT',   value: '40 kHz ultrasonic array, 4x MEMS nodes' },
      { name: 'RGB Camera',     value: 'Sony IMX477 12 MP with motorized 3-axis gimbal' },
      { name: 'Barometer',      value: 'MS5611 — 10 cm altitude precision' },
    ],
  },
  {
    category: 'Intelligence',
    items: [
      { name: 'Flight Computer', value: 'Nvidia Jetson Orin NX 16 GB — 100 TOPS' },
      { name: 'Navigation',      value: 'APF + PINN hybrid, real-time obstacle field' },
      { name: 'Physics Engine',  value: 'Navier-Stokes PINN via PyTorch 2.0 CUDA' },
      { name: 'Communication',   value: 'ZMQ 5556/5558 bridge + ROS 2 Humble DDS' },
      { name: 'Fail-Safe',       value: 'Triple-redundant IMU + Geo-fence RTL' },
      { name: 'Update Rate',     value: 'Telemetry 24 Hz — Sensor fusion 200 Hz' },
    ],
  },
];

const WHY_BEST = [
  {
    title: 'CFD-Guided Navigation',
    body:  'Physics-Informed Neural Networks model real-time airflow, thermal plumes, and chemical diffusion — not pre-planned waypoints.',
  },
  {
    title: 'Hexacopter Fault Tolerance',
    body:  'Loss of any single motor is recovered automatically via live torque rebalancing. Mission continues uninterrupted.',
  },
  {
    title: 'Live Digital Twin',
    body:  'Every sensor reading is mirrored in the 3D spatial view in under 50 ms via ZMQ-WebSocket bridge.',
  },
  {
    title: 'SCADA Anomaly Guard',
    body:  'Detects divergence between DCS-reported plant state and physically observed sensor data. Exposes spoofed readings instantly.',
  },
];

const DroneSpecs = () => {
  const [tab, setTab] = useState('Airframe');
  const active = SPECS.find(s => s.category === tab) || SPECS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 500 }}>

      {/* Title */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-main)' }}>
          VectorSense Hexacopter
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
          Industrial Autonomous Inspection Platform &middot; Rev 3.2
        </div>
      </div>

      {/* Why Best — 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {WHY_BEST.map(w => (
          <div key={w.title} className="why-card">
            <div className="wc-title">{w.title}</div>
            <div className="wc-body">{w.body}</div>
          </div>
        ))}
      </div>

      {/* Spec Tabs */}
      <div className="spec-tab-bar">
        {SPECS.map(s => (
          <button
            key={s.category}
            id={`spec-tab-${s.category.toLowerCase()}`}
            className={`spec-tab${tab === s.category ? ' active' : ''}`}
            onClick={() => setTab(s.category)}
          >
            {s.category}
          </button>
        ))}
      </div>

      {/* Spec Rows */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--panel-border)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 16px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {active.items.map(item => (
          <div key={item.name} className="item-row">
            <span className="key">{item.name}</span>
            <span className="value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DroneSpecs;
