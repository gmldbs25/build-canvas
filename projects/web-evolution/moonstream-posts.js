export const communityTags = {
  observing: 'observing',
  telescopes: 'telescopes',
  planets: 'planets',
  comets: 'comets',
  moon: 'moon',
};

const nasaMedia = 'https://www.nasa.gov/nasa-brand-center/images-and-media/';
const negevSource = 'https://commons.wikimedia.org/wiki/File:Amateur_astronomy_in_israel.jpg';

export const observingPhoto = {
  id: 'observer-negev',
  page: 'post-observer-negev',
  title: 'Setting up under the Negev sky',
  author: 'Ilan Shimony',
  place: 'Negev, Israel',
  date: 'Jul 2005',
  alt: 'An amateur astronomer setting up a Dobsonian telescope under a dark sky.',
  notes: 'A Dobsonian telescope being set up for an observing session. A field photo like this shows the equipment and the site as well as the sky.',
  tags: ['observing', 'telescopes'],
  comments: [['startrail', 'You can see both the rig and the sky in one frame. How dark was the site once your eyes adjusted?']],
  credit: 'Ilan Shimony · Wikimedia Commons · resized and converted to WebP',
  sourceUrl: negevSource,
  originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Amateur_astronomy_in_israel.jpg',
  license: 'CC BY-SA 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  image: './media/pacebook/observer-negev.webp',
  width: 960,
  height: 1280,
};

export const referencePhotos = [
  {
    id: 'saturn-cassini-2004',
    title: 'Saturn and its rings from Cassini',
    author: 'NASA/JPL/Space Science Institute',
    date: 'Jul 13, 2004',
    alt: 'Saturn and its rings in a Cassini photograph.',
    notes: 'Cassini captured this view shortly after arriving at Saturn. Use it as a reference when comparing the tilt of the rings with your own telescope view.',
    tags: ['planets'],
    sourceUrl: 'https://science.nasa.gov/photojournal/saturn-in-full-view/',
    width: 1166,
    height: 649,
  },
  {
    id: 'jupiter-galileo-1997',
    title: 'Jupiter’s Great Red Spot',
    author: 'NASA/JPL',
    date: '1996–1997',
    alt: 'Jupiter’s Great Red Spot and surrounding cloud bands in a Galileo mosaic.',
    notes: 'A Galileo mosaic of the Great Red Spot and nearby cloud bands. It provides a close reference for the storm that backyard observers try to spot.',
    tags: ['planets'],
    sourceUrl: 'https://science.nasa.gov/photojournal/true-color-of-jupiters-great-red-spot/',
    width: 1280,
    height: 915,
  },
  {
    id: 'hale-bopp-hubble-1997',
    title: 'Hale–Bopp through Hubble',
    author: 'H. Weaver (Johns Hopkins University) and NASA',
    date: 'Mar 27, 1997 · release',
    alt: 'A sequence of Hubble observations of comet Hale–Bopp.',
    notes: 'This sequence records changes in the inner coma of the comet many observers watched from Earth in 1997.',
    tags: ['comets'],
    sourceUrl: 'https://science.nasa.gov/asset/hubble/hubble-images-of-comet-hale-bopp/',
    width: 1280,
    height: 916,
  },
  {
    id: 'apollo-moltke-crater',
    title: 'Moltke crater from Apollo 10',
    author: 'NASA',
    date: 'May 1969',
    alt: 'Moltke crater on the Moon in an Apollo 10 Hasselblad photograph.',
    notes: 'An orbital image of the bright-rimmed crater near the Sea of Tranquility. Use it to compare with what you can make out near the lunar terminator.',
    tags: ['moon'],
    sourceUrl: 'https://science.nasa.gov/image-detail/moltke-apollo-10/',
    width: 1269,
    height: 1280,
  },
].map((photo) => ({
  ...photo,
  page: `post-${photo.id}`,
  image: `./media/pacebook/${photo.id}.webp`,
  credit: `${photo.author} · resized and converted to WebP`,
  license: 'NASA media guidance',
  licenseUrl: nasaMedia,
  reference: true,
}));

export const communityPages = Object.fromEntries([
  ...[observingPhoto, ...referencePhotos].map(({ id, page, title }) => [page, [title, `/photos/community/${id}/`]]),
  ...Object.entries(communityTags).map(([tag, label]) => [`tag-${tag}`, [`Photos tagged “${label}”`, `/photos/tags/${tag}/`]]),
]);
