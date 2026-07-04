import React from "react";

export interface NavHeaderProps {
  overline?: string;
  title: string;
  right?: React.ReactNode;
}

/** Screen header: uppercase display title + optional kicker. */
export function NavHeader({ overline, title, right }: NavHeaderProps) {
  return (
    <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        {overline && (
          <div className="if-overline" style={{ color: "var(--forest-500)", marginBottom: 6 }}>
            {overline}
          </div>
        )}
        <h1 className="if-display" style={{ fontSize: 34, margin: 0 }}>
          {title}
        </h1>
      </div>
      {right}
    </header>
  );
}
