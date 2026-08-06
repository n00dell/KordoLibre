// src/components/TabBlock.tsx
interface Props {
    tabData: string;
}

export default function TabBlock({ tabData }: Props) {
    return (
        <pre
            style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#e5e5e5",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "18px",
                overflowX: "auto",
                whiteSpace: "pre"
            }}
        >
            {tabData}
        </pre>
    );
}