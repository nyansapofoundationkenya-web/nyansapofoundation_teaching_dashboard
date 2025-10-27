// components/Overview/OverviewCards.tsx
const OverviewCards = () => {
  const cards = [
    {
      title: "Average Literacy Score (All Grades)",
      value: "78%",
      color: "bg-blue-500",
      icon: "📊"
    },
    {
      title: "Average Numeracy Score (All Grades)",
      value: "65%",
      color: "bg-green-500",
      icon: "🔢"
    },
    {
      title: "Schools Above Grade Level Target",
      value: "85%",
      color: "bg-purple-500",
      icon: "🎯"
    },
    {
      title: "Total Learners Tracked",
      value: "15,200",
      color: "bg-orange-500",
      icon: "👥"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${card.color} h-2 rounded-full`}
                style={{
                  width: card.value.includes('%') 
                    ? card.value 
                    : '100%'
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;