interface BoardLabelsProps {
  size: number;
}

export function BoardLabels({ size }: BoardLabelsProps) {
  return (
    <>
      {Array.from({ length: size }, (_, i) => (
        <div
          key={`col-${i}`}
          className="text-center text-xs font-semibold text-gray-600"
          style={{ gridRow: 1, gridColumn: i + 2 }}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      
      {Array.from({ length: size }, (_, i) => (
        <div
          key={`row-${i}`}
          className="text-right pl-1 pr-1 text-xs font-semibold text-gray-600 self-center"
          style={{ gridRow: i + 2, gridColumn: 1 }}
        >
           {i + 1}
        </div>
      ))}
    </>
  );
}
