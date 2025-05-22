import { ModalComponent } from "@components/shared/modal/modal";
import { GameStateContext } from "@interfaces/context";
import { cardMidResImageMap } from "@utils/card-image.utils";
import { getAnimalPhrase, getRandomCongratulation } from "@utils/text.utils";
import { useContext, useRef } from "preact/compat";
import "./game-over.css";

/**
 * GameOverComponent is presented to the user upon the completion of a game. It displays
 * a congratulatory message and shows last played card in hig resolution, so user can see more card details.
 */
export function GameOverComponent() {
  const { lastOpenedCardType } = useContext(GameStateContext);

  const headerMessage = useRef(getRandomCongratulation());
  const lastCardType = cardMidResImageMap.get(lastOpenedCardType.value);
  const encouragingPhrase = getAnimalPhrase(lastOpenedCardType.value);

  return (
    <ModalComponent title={headerMessage.current} className="game-over">
      <div class="game-over__last-card">
        <img
          class="game-over__last-card-image"
          src={lastCardType}
          alt="animal card"
          loading="eager"
        />
      </div>
      <div className="game-over__animal-phrase">{encouragingPhrase}</div>
    </ModalComponent>
  );
}
