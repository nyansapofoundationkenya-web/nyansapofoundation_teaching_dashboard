import useLearningStats from '@/hooks/overview/useLearningStats';

const OverviewCards = ({ orgId }) => {
  const { 
    averageLiteracy, 
    averageNumeracy, 
    schoolsAboveTarget, 
    totalLearners, 
    loading, 
    error 
  } = useLearningStats(orgId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-600 rounded w-24"></div>
                <div className="h-6 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-600 rounded-xl"></div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-background-lighter rounded-full h-2">
                <div className="bg-gray-600 h-2 rounded-full w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-red-500 p-6 text-center">
        <p className="text-red-400">Error loading statistics: {error}</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Average Literacy Score (All Grades)",
      value: averageLiteracy,
      color: "bg-primary-2",
      icon: "📊"
    },
    {
      title: "Average Numeracy Score (All Grades)",
      value: averageNumeracy,
      color: "bg-secondary-2",
      icon: "🔢"
    },
    {
      title: "Schools Above Grade Level Target",
      value: schoolsAboveTarget,
      color: "bg-primary-3",
      icon: "🎯"
    },
    {
      title: "Total Learners Tracked",
      value: totalLearners,
      color: "bg-secondary-1",
      icon: "👥"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {card.value}
              </p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-background-lighter rounded-full h-2">
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