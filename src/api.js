export function fetchCardFromSet(set, cardname, callback) {
  fetch("https://mtgjson.com/json/" + set + ".json")
    .then(function(response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(result => {
      return result.json();
    })
    .then(data => {
      let chosenCard = data.cards.filter(card => card.name === cardname)[0]
      chosenCard.imagePath = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + chosenCard.multiverseId + "&type=card";
      callback(chosenCard)
    })
    .catch(error => console.error(error));
}

export async function fetchSet(set) {
  return fetch("https://mtgjson.com/json/" + set + ".json")
    .then(function(response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(result => {
      return result.json();
    })
    .then(data => {
      let cards = data.cards.map(addMetadataToCard)

      // TODO : don't blacklist, come up with ones that don't work
      const blacklistIds = [
        'd228ad88-669a-435f-a2fd-6188261988ea',
        '60d002f9-ae69-4e07-943f-95036f083dea',
        '07997554-9fd7-4d6f-abaf-6c3fda9644d2',
        '76e5a14b-8fd2-4a62-90dc-4adb1cee4505'
      ]
      return cards.filter(card => !blacklistIds.includes(card.scryfallId) && !card.supertypes.includes('Basic') && !card.isStarter)
    })
    .catch(error => console.error(error));
}

export async function generateRarities(set) {
  let cards = await fetchSet(set)
  let rarities = {
    'common': [],
    'uncommon': [],
    'rare': [],
    'mythic': []
  }

  cards.forEach(card => {
    rarities[card.rarity].push(card)
  })

  return rarities
}

export function addMetadataToCard(card) {
  // card.imagePath = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + (card.multiverse_ids ? card.multiverse_ids[0] : card.multiverseId) + "&type=card";
  // console.log(card)
  card.imagePath = (card.card_faces && card.card_faces[0].image_uris) ? card.card_faces[0].image_uris.normal : card.image_uris.normal
  return card
}

export async function getLatestCard(cardName) {
  let card =
    (await
      (await fetch(`https://api.scryfall.com/cards/search?order=name&q=game%3Apaper+%21"${encodeURIComponent(cardName)}"`))
    .json()).data[0]
  // console.log(card)
  addMetadataToCard(card)
  return card
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateCubePacks(number) {
  let cubeFile = await (await fetch(process.env.PUBLIC_URL + '/data/mtgo_chris_wolfs_vintage_supreme_draft.txt')).text()
  let data = await (await fetch(process.env.PUBLIC_URL + '/data/cube.json')).json()
  
  let cards = cubeFile.split('\n').filter(card => card)
  // shuffle once
  shuffle(cards)
  
  let packs = []
  let cardIndex = 0
  
  for (let i = 0; i < number; i++) {
    packs.push([])
    let packNames = new Set()
    let tempIndex = cardIndex
    
    for (let j = 0; j < 15; j++) {
      let name = cards[tempIndex++]
      if (!name) break
      
      if (packNames.has(name)) {
        j-- // don't count this slot, try next card
        continue
      }
      
      packNames.add(name)
      if (!data[name]) {
        console.warn("FAILED FOR", name, "| charCodes:", [...name].map(c => c.charCodeAt(0)))
        j-- // don't waste a pack slot
        continue
      }
      console.log(name)
      packs[i].push(data[name])
    }
    cardIndex = tempIndex
  }
  
  return packs
}