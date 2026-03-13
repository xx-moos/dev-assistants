import React from "react";
import { useEventEmitter, useReactive } from "ahooks";
import styles from "./index.module.less";

import ConfigCard from "./components/ConfigCard";
import CenterCard from "./components/CenterCard";

export default function Index() {
  const changeModel = useEventEmitter();
  const changeTestType = useEventEmitter();

  const state = useReactive({
    allModels: [],
    selectedModels: [],
    selectedTestTypes: [],
  });

  changeModel.useSubscription((value) => {
    state.selectedModels = value;
  });
  changeTestType.useSubscription((value) => {
    state.selectedTestTypes = value;
  });

  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <ConfigCard
          fetchModelListCallback={(models) => {
            state.allModels = models;
          }}
        />

        <CenterCard
          allModels={state.allModels}
          changeModelCallback={changeModel}
          changeTestTypeCallback={changeTestType}
        />
      </div>
    </div>
  );
}
