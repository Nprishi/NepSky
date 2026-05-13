import React from 'react';

const UseCaseDiagram: React.FC = () => {
  return (
    <div className="w-full flex justify-center py-6">
      <svg
        viewBox="0 0 1200 520"
        width="100%"
        height="auto"
        role="img"
        aria-label="Use case diagram for NepSky booking system"
      >
        <style>{`
          .actor { fill:#0f172a; color:#0f172a; font:700 14px/1.2 Inter, system-ui, -apple-system; }
          .usecase { fill:#fff; stroke:#2563eb; stroke-width:3; }
          .uc-text { fill:#0f172a; font:600 14px/1.2 Inter, system-ui, -apple-system; }
          .connector { stroke:#111827; stroke-width:2; }
          .label { fill:#111827; font:600 13px/1.2 Inter, system-ui, -apple-system; }
        `}</style>

        {/* Actors (left + right) */}
        <g transform="translate(60,80)">
          <g className="actor" transform="translate(0,0)">
            <circle cx="0" cy="0" r="20" fill="#0ea5e9" />
            <text x="0" y="52" textAnchor="middle" className="label">User</text>
            <rect x="-18" y="26" width="36" height="48" rx="6" fill="#e6f6ff" stroke="#0ea5e9" />
          </g>
        </g>

        <g transform="translate(1140,80)">
          <g className="actor" transform="translate(0,0)">
            <circle cx="0" cy="0" r="20" fill="#f97316" />
            <text x="0" y="52" textAnchor="middle" className="label">Admin</text>
            <rect x="-18" y="26" width="36" height="48" rx="6" fill="#fff4e6" stroke="#f97316" />
          </g>
        </g>

        {/* Use cases (ovals) */}
        <g transform="translate(300,60)">
          <ellipse className="usecase" cx="0" cy="0" rx="140" ry="44" />
          <text className="uc-text" x="0" y="6" textAnchor="middle">Search Flights</text>
        </g>

        <g transform="translate(300,170)">
          <ellipse className="usecase" cx="0" cy="0" rx="160" ry="44" />
          <text className="uc-text" x="0" y="6" textAnchor="middle">Select Seats & Passenger Info</text>
        </g>

        <g transform="translate(300,280)">
          <ellipse className="usecase" cx="0" cy="0" rx="130" ry="44" />
          <text className="uc-text" x="0" y="6" textAnchor="middle">Make Payment</text>
        </g>

        <g transform="translate(760,170)">
          <ellipse className="usecase" cx="0" cy="0" rx="160" ry="44" />
          <text className="uc-text" x="0" y="6" textAnchor="middle">Manage Bookings</text>
        </g>

        <g transform="translate(760,60)">
          <ellipse className="usecase" cx="0" cy="0" rx="140" ry="44" />
          <text className="uc-text" x="0" y="6" textAnchor="middle">Admin: Flight Management</text>
        </g>

        <g transform="translate(760,280)">
          <ellipse className="usecase" cx="0" cy="0" rx="150" ry="44" />
          <text className="uc-text" x="0" y="6" textAnchor="middle">Admin: Payment & Reports</text>
        </g>

        {/* Connectors from User to use cases */}
        <line x1="80" y1="80" x2="160" y2="60" className="connector" />
        <line x1="80" y1="132" x2="160" y2="170" className="connector" />
        <line x1="80" y1="204" x2="160" y2="280" className="connector" />

        {/* Connectors from Admin to use cases */}
        <line x1="1120" y1="80" x2="950" y2="60" className="connector" />
        <line x1="1120" y1="132" x2="950" y2="170" className="connector" />
        <line x1="1120" y1="204" x2="950" y2="280" className="connector" />

        {/* Small legend */}
        <g transform="translate(20,420)">
          <rect x="0" y="0" width="1160" height="82" rx="8" fill="#ffffff" stroke="#e5e7eb" />
          <text x="18" y="28" className="label">Actors:</text>
          <text x="18" y="52" className="label">User — Customer who searches, books, pays and checks-in. Admin — Manages flights, bookings and payments.</text>
        </g>
      </svg>
    </div>
  );
};

export default UseCaseDiagram;
