import { useCallback, useEffect, useState } from "react";
import { applyAction } from "./sim/apply";
import { createNewGame } from "./sim/create";
import type { CreatePayload, GameAction, GameState } from "./sim/types";
import { downloadSave, hasLocalSave, loadFromLocal, readSaveFile, saveToLocal } from "./save/persist";
import { CreateScreen } from "./ui/CreateScreen";
import { GameHud } from "./ui/GameHud";
import { LoginCrawl } from "./ui/LoginCrawl";
import { SettingsScreen } from "./ui/SettingsScreen";
import { TitleScreen } from "./ui/TitleScreen";

type Overlay = "title" | "create" | "settings" | "play";

export function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [overlay, setOverlay] = useState<Overlay>("title");
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(hasLocalSave());
  }, [game]);

  const commit = useCallback((next: GameState) => {
    setGame(next);
    saveToLocal(next);
    setHasSave(true);
  }, []);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!game) return;
      commit(applyAction(game, action));
    },
    [game, commit],
  );

  function start(p: CreatePayload) {
    const g = createNewGame(p);
    commit(g);
    setOverlay("play");
  }

  function load() {
    const g = loadFromLocal();
    if (!g) return;
    if (g.screen === "login") {
      setGame(g);
      setOverlay("play");
      return;
    }
    commit({ ...g, screen: "game" });
    setOverlay("play");
  }

  if (overlay === "create") {
    return <CreateScreen onBack={() => setOverlay("title")} onSubmit={start} />;
  }

  if (overlay === "settings") {
    return (
      <SettingsScreen
        state={game ?? loadFromLocal()}
        onBack={() => setOverlay(game?.screen === "game" ? "play" : "title")}
        onToggleLlm={(v) => {
          if (game) dispatch({ type: "SET_LLM", enabled: v });
        }}
        onExport={() => {
          const g = game ?? loadFromLocal();
          if (g) downloadSave(g);
        }}
        onImport={async (file) => {
          const g = await readSaveFile(file);
          commit({ ...g, screen: "game" });
          setOverlay("play");
        }}
      />
    );
  }

  if (overlay === "play" && game) {
    if (game.screen === "login") {
      return (
        <LoginCrawl
          onFinish={() => dispatch({ type: "FINISH_LOGIN" })}
          onSkip={() => dispatch({ type: "SKIP_TUTORIAL" })}
        />
      );
    }
    return (
      <GameHud
        state={game}
        onAction={dispatch}
        onTitle={() => setOverlay("title")}
        onSettings={() => setOverlay("settings")}
      />
    );
  }

  return (
    <TitleScreen
      hasSave={hasSave}
      onCreate={() => setOverlay("create")}
      onLoad={load}
      onSettings={() => setOverlay("settings")}
    />
  );
}
