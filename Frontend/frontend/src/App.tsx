import { useState } from 'react';
import TabOne from './Tab1/TabOne';
import TabTwo from './Tab2/TabTwo';

function App() {
  const [activeTab, setActiveTab] = useState('default');

  const renderTab = () => {
    switch (activeTab) {
      case 'Tab1':
        return <TabOne />;
      case 'Tab2':
        return <TabTwo />;
      default:
        return (
          <div className="text-center text-gray-500">
            Please select a tab to begin.
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl text-center">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">My React Tabs</h1>

        <div className="flex justify-center space-x-6 border-b border-gray-300 mb-6">
          <button
            className={`px-4 py-2 text-sm ${
              activeTab === 'Tab1'
                ? 'border-b-2 border-blue-600 font-semibold text-blue-700'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab('Tab1')}
          >
            Calculator
          </button>
          <button
            className={`px-4 py-2 text-sm ${
              activeTab === 'Tab2'
                ? 'border-b-2 border-blue-600 font-semibold text-blue-700'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab('Tab2')}
          >
            Tab 2
          </button>
        </div>

        {renderTab()}
      </div>
    </div>
  );
}

export default App;
