import { useHasData } from "./hooks/useHasData.js";
import { DashboardLayout } from "./components/dashboard/DashboardLayout.js";
import { FirstTimeUploadScreen } from "./components/upload/FirstTimeUploadScreen.js";

function App() {
  const { data: hasData, isLoading } = useHasData();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!hasData) {
    return <FirstTimeUploadScreen />;
  }

  return <DashboardLayout />;
}

export default App;
