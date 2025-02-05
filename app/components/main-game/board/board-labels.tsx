
interface BoardLabelsProps {
  size: number;
}

export const BoardLabels = ({ size }: BoardLabelsProps) => {
  return (
    <>
      {/* Row labels (numbers) */}
      <div className="absolute left-0 top-10 bottom-10 flex flex-col justify-around text-xs sm:text-sm font-medium text-gray-600">
        {Array.from({ length: size }, (_, i) => (
          <div key={`row-${i}`} className="flex items-center justify-center w-6">
            {i + 1}
          </div>
        ))}
      </div>
      {/* Column labels (letters) */}
      <div className="absolute top-0 left-10 right-10 flex justify-around text-xs sm:text-sm font-medium text-gray-600">
        {Array.from({ length: size }, (_, i) => (
          <div key={`col-${String.fromCharCode(65 + i)}`} className="flex items-center justify-center h-6 w-full">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
    </>
  );
};