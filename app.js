const pagination = (() => {
  const limit = 10
  let offset = 0

  const getLimit = ()=> limit
  const getOffset = ()=> offset
  const incrementOffset = ()=> offset += limit

  return { getLimit, getOffset, incrementOffset}
})()



const getTypeColor = type => {
  const normal = '#F5F5F5'
  return {
    normal,
    fire: '#FDDFDF',
    grass: '#DEFDE0',
    electric: '#FCF7DE',
    ice: '#DEF3FD',
    water: '#DEF3FD',
    ground: '#F4E7DA',
    rock: '#D5D5D4',
    fairy: '#FCEAFF',
    poison: '#98D7A5',
    bug: '#F8D5A3',
    ghost: '#CAC0F7',
    dragon: '#97B3E6',
    psychic: '#EAEDA1',
    fighting: '#E6E0D4'
  }[type] || normal
}


const handlePageLoader = async() => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${pagination.getLimit()}&offset=${pagination.getOffset()}`)
    if(!response.ok){
      throw new Error(`Fetching ${URL} failed`)
    }
    const {results: data} = await response.json()
    const promises = data.map(item => fetch(item.url))
    const resultsPokemons = await Promise.allSettled(promises)
    const fulfilled = resultsPokemons.filter(item => item.status === 'fulfilled')
    const promisesURLsPoke = fulfilled.map(url => url.value.json())

    const pokemons = await Promise.all(promisesURLsPoke)

    const types = pokemons.map(fullField => fullField.types.map(info => info.type.name))
    const ids = data.map(item => item.url.split('/')[6])

    const promisesImgs = ids.map(id => fetch(`./assets/img/${id}.png`))
    const imgResolve = await Promise.allSettled(promisesImgs)
    const fulfilledImg = imgResolve.filter(item => item.status === 'fulfilled')
    const imgs = fulfilledImg.map(item => item.value.url)

    pagination.incrementOffset()

    return ids.map((id, index) => {
      return {
        id,
        name: data[index].name,
        types: types[index],
        imgUrl: imgs[index],
      }
    })


  } catch (error) {
    console.log("Error:", error.message)
  }

}

const renderPokemons = (pokemons) => {
  const ul = document.querySelector('[data-js="pokemons-list"]')
  const fragment = document.createDocumentFragment()

  pokemons.forEach(({id, name, types, imgUrl}) => {
    const li = document.createElement('li')
    const img = document.createElement('img')
    const subtitle = document.createElement('h2')
    const text = document.createElement('p')

    const [firstType] = types

    img.setAttribute('src', imgUrl)
    img.setAttribute('alt', name)
    img.setAttribute('class', 'card-image')


    li.setAttribute('class', `card ${firstType}`)
    li.style.setProperty('--type-color', getTypeColor(firstType))

    subtitle.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`
    text.textContent = types.length > 1 ? types.join(' | ') : firstType

    li.append(img, subtitle, text)


    fragment.append(li)
    // console.log(ul)
    // ul.append(li)
  })
  ul.append(fragment)
}

const renderPokemonsNext = async() => {
  const pokemonsObserver = new IntersectionObserver(async (elements, observe)=>{
    if (!elements[0].isIntersecting) {
      return
    }
    observe.unobserve(elements[0].target)

    if (pagination.getOffset() >= 150) {
      return
    }
    const p = await handlePageLoader()
    renderPokemons(p)


    const endPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild
    pokemonsObserver.observe(endPokemon)
  })

  const endPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild
  pokemonsObserver.observe(endPokemon)

  console.log(pokemonsObserver)
}

const wook = async () => {
  const pokemons = await handlePageLoader()
  renderPokemons(pokemons)
  renderPokemonsNext()
}

window.onload = () => {
  wook()
}