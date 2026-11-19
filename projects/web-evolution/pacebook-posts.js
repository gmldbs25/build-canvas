export const people = {
  you: { name: 'You', initials: 'Y', color: 'berry' },
  maya: { name: 'Maya Ortega', initials: 'MO', color: 'terra' },
  ellis: { name: 'Ellis Park', initials: 'EP', color: 'moss' },
  noah: { name: 'Noah Bennett', initials: 'NB', color: 'indigo' },
  nina: { name: 'Nina Patel', initials: 'NP', color: 'berry' },
  cal: { name: 'Cal Reed', initials: 'CR', color: 'slate' },
  leah: { name: 'Leah Kim', initials: 'LK', color: 'gold' },
  june: { name: 'June Okafor', initials: 'JO', color: 'indigo' },
  samir: { name: 'Samir Holt', initials: 'SH', color: 'moss' },
  tess: { name: 'Tess Alvarez', initials: 'TA', color: 'terra' },
};

export const posts = [
  {
    id: 'ridge-road', author: 'maya', date: '2013-11-30', clock: '8:41 am', place: 'Ridge Road',
    text: 'We took the long way home last night and pulled over once the lights disappeared. It reminded me of Ilan Shimony’s photo of a Dobsonian out in the Negev. Next time I’m packing a real chair.',
    photo: ['observer-negev', 'An amateur astronomer and Dobsonian telescope under a dark sky in the Negev', 'Amateur observing in the Negev · Ilan Shimony'],
    likes: 34,
    comments: [
      ['ellis', 'Is this the turnout just past the cattle grid?', [['maya', 'The next one up! There’s just enough room for two cars.']]],
      ['nina', 'Love that you can see the setup and the sky in the same frame.'],
      ['maya', 'Right? Usually every photo of our evenings is just black with a blurry red light.'],
    ],
  },
  {
    id: 'first-orion', author: 'noah', date: '2013-11-29', clock: '10:18 pm',
    text: 'My first go at Orion came out as a smudge, so here’s the Hubble photo I’ve been using to get my bearings. The little patch below the belt is doing a lot more than I realized.',
    photo: ['orion-nebula-hubble-2006', 'The glowing gas and stars of the Orion Nebula in a Hubble image', 'Orion Nebula · NASA/ESA Hubble'],
    likes: 26,
    comments: [
      ['cal', 'Try keeping a few short exposures for those bright middle stars.', [['noah', 'Good call. I’ll try that when the clouds move on.']]],
      ['tess', 'I had no idea that faint patch below the belt looked like this.'],
    ],
  },
  {
    id: 'saturday', author: 'leah', date: '2013-11-28', clock: '6:24 pm',
    text: 'Anyone heading out on Saturday? I’m bringing two thermoses and the red flashlight I finally found in the coat closet. If we get clouded out, coffee instead.',
    likes: 15, comments: [['samir', 'I can give two people a ride from the library.'], ['june', 'Clouds or no clouds, I volunteer for coffee.']],
  },
  {
    id: 'moon-over-roof', author: 'nina', date: '2013-11-26', clock: '7:51 am',
    text: 'Caught the Moon on the way out for work. I keep this mountain moonrise by McKay Savage saved on my laptop because the horizon makes the Moon feel close enough to touch.',
    photo: ['moonrise-mountains', 'The Moon rising over a mountainous landscape', 'Mountain moonrise · McKay Savage'],
    likes: 41,
    comments: [['june', 'The shadows make it look like it’s hanging right in front of you.'], ['nina', 'Seeing it through the eyepiece before work felt like borrowing a few minutes from the day.']],
  },
  {
    id: 'workbench', author: 'cal', date: '2013-11-24', clock: '4:03 pm',
    text: 'Putting the mount back together. The screw that took an hour to find was stuck to the magnet on my work light the whole time. I’m choosing to call that a successful repair.',
    likes: 12, comments: [['ellis', 'Last time I took mine apart I had two screws left over. It still tracks.']],
  },
  {
    id: 'galaxy-in-infrared', author: 'june', date: '2013-11-22', clock: '9:37 pm',
    text: 'I opened this WISE mosaic while I was trying to clean up my own Milky Way stack and lost the next hour. That warm band is a view in infrared. It makes our own galaxy feel unfamiliar in a good way.',
    photo: ['wise-milky-way-2012', 'An infrared mosaic of the Milky Way as recorded by WISE', 'The Milky Way in infrared · NASA/JPL-Caltech/UCLA'],
    likes: 52,
    comments: [['nina', 'I didn’t recognize the Milky Way until I read the caption.', [['june', 'Same here. It’s a view made from wavelengths our eyes don’t see.']]], ['noah', 'Going to leave this open for when I get home.']],
  },
  {
    id: 'late-bus', author: 'tess', date: '2013-11-20', clock: '5:16 pm',
    text: 'The 42 is running late again. On the bright side the bakery has a tray of cinnamon rolls left, so I have a clear plan for the next twenty minutes.',
    likes: 9, comments: [['leah', 'Save me one if I can get across town in time!'], ['tess', 'One in the bag. No promises about two.']],
  },
  {
    id: 'rings', author: 'samir', date: '2013-11-17', clock: '11:02 am',
    text: 'I still remember looking through a borrowed telescope and realizing those rings weren’t just something in a textbook. Sharing my favorite Cassini frame this morning.',
    photo: ['saturn-cassini-2004', 'Saturn and its illuminated rings in a Cassini image', 'Saturn from Cassini · NASA/JPL/Space Science Institute'],
    likes: 37, comments: [['tess', 'That first look is exactly what got me into it too.'], ['cal', 'Love how clearly the rings separate from the planet here.']],
  },
  {
    id: 'november-notes', author: 'ellis', date: '2013-11-14', clock: '8:12 pm',
    text: 'Cleaned up my autumn observing notes. The most useful column has turned out to be “what I forgot.” So far: gloves, lens cap, pencil, and which pocket has the gloves.',
    likes: 18, comments: [['maya', 'I always write “clear” at the start and then forget to note when the clouds roll in.']],
  },
  {
    id: 'venus-crossing', author: 'leah', date: '2013-11-11', clock: '6:13 pm',
    text: 'Do you remember passing around those solar glasses last summer? NASA’s view of Venus crossing the Sun does a better job of showing the scale than my picture of the back of everybody’s head.',
    photo: ['venus-transit-2012', 'Venus silhouetted against the Sun during the 2012 transit', 'Transit of Venus · NASA/SDO'],
    likes: 29, comments: [['samir', 'I remember someone ran up from the parking lot with a colander.'], ['leah', 'We got very invested in that dot.']],
  },
  {
    id: 'hillside-frame', author: 'tess', date: '2013-11-07', clock: '9:45 pm',
    text: 'One for the August planning folder. Jared Tennant caught this Perseid near Austin in 2009. I like that he left enough ground in the frame to remember it was taken somewhere real.',
    photo: ['perseid-austin', 'A Perseid meteor photographed over the Austin area at night', 'Perseid over Austin · Jared Tennant'],
    likes: 46, comments: [['maya', 'Keeping the horizon makes the whole thing feel more like being there.']],
  },
  {
    id: 'archive-crater', author: 'cal', date: '2013-10-30', clock: '2:08 pm',
    text: 'Found this Apollo 10 shot in the files I saved for a talk. The bright rim of Moltke is easy to pick out when the Sun is low. I’m putting it back on my list after months of looking at the same three craters.',
    photo: ['apollo-moltke-crater', 'Moltke crater on the Moon in a photo taken on Apollo 10', 'Moltke crater · NASA Apollo 10'],
    likes: 22, comments: [['noah', 'Hunting for this one when the Moon comes around again.']],
  },
  {
    id: 'red-spot', author: 'june', date: '2013-10-27', clock: '10:18 pm',
    text: 'I could find two bands on Jupiter tonight and not much else. The Galileo picture of the Great Red Spot is a pretty good reward for coming inside and thawing out.',
    photo: ['jupiter-galileo-1997', 'Jupiter’s Great Red Spot and surrounding cloud bands seen by Galileo', 'Jupiter’s Great Red Spot · NASA/JPL'],
    likes: 35, comments: [['ellis', 'Two bands on a cold night counts.'], ['samir', 'I keep forgetting the spot is a storm. That scale is hard to imagine.']],
  },
  {
    id: 'next-night', author: 'ellis', date: '2013-10-23', clock: '6:45 pm',
    text: 'I put an Observing Night poster in Fieldwork if anyone wants to adjust the crop before I print it. Mine keeps cutting off the top of the Moon.',
    poster: true, likes: 11, comments: [['nina', 'I’ll try a tighter crop that keeps the bright edge.'], ['ellis', 'Thanks. I’m using the files from our photo thread.']],
  },
  {
    id: 'rain-plan', author: 'samir', date: '2013-10-16', clock: '8:29 pm',
    text: 'It’s raining, which means I’m finally sorting the photo folder. Made it all the way through June before I found a picture of a finger over the lens and decided I’d earned a break.',
    likes: 8, comments: [['june', 'Please tell me you kept the finger photo.'], ['samir', 'It’s now in a folder called Essentials.']],
  },
  {
    id: 'old-comet', author: 'nina', date: '2013-10-12', clock: '8:12 pm',
    text: 'My dad called to ask if I remembered Hale–Bopp. I remember him getting us out in the driveway before breakfast. I sent him this Hubble image. He replied asking which pin on the map was our house.',
    photo: ['hale-bopp-hubble-1997', 'Comet Hale–Bopp in a 1997 Hubble image', 'Comet Hale–Bopp · Hubble'],
    likes: 27, comments: [['leah', 'That’s exactly what my dad would say.']],
  },
];
