import { render } from "@testing-library/react";
import MainWeightChart from "../components/MainWeightChart";

test("renders main weight chart without crashing", () => {
  const data = [
    {
      date: "2024-01-01",
      weight: 72,
      avg7: 72,
      avg30: 72,
      gym: false,
      bike: false,
      boxing: false,
      run: false,
    },
  ];

  const { container } = render(
    <MainWeightChart
      chartData={data}
      showActivities={{ gym: false, bike: false, boxing: false, run: false }}
    />,
  );

  expect(container.firstChild).toBeTruthy();
});
