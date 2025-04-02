import React from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import useSound from 'use-sound';

interface Story {
  id: string;
  image: string;
  title: string;
  creator: string;
}

const stories: Story[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    title: 'AI Development',
    creator: 'Tech Innovators'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=2378&q=80',
    title: 'Space Tech',
    creator: 'Space Labs'
  }
];

export function FeaturedStories() {
  const [activeStory, setActiveStory] = React.useState(0);
  const [playTap] = useSound('/sounds/tap.mp3', { volume: 0.5 });

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeStory < stories.length - 1) {
        setActiveStory(prev => prev + 1);
        playTap();
      }
    },
    onSwipedRight: () => {
      if (activeStory > 0) {
        setActiveStory(prev => prev - 1);
        playTap();
      }
    }
  });

  return (
    <section className="py-6 overflow-hidden">
      <div className="px-4">
        <h2 className="text-sm font-light tracking-widest text-white/60 mb-4">
          FEATURED
        </h2>
        <div className="relative" {...handlers}>
          <div className="flex overflow-hidden rounded-2xl aspect-[4/5]">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                className="relative min-w-full"
                initial={false}
                animate={{
                  x: `${-100 * activeStory}%`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-light tracking-wide text-white mb-2">
                    {story.title}
                  </h3>
                  <p className="text-sm text-white/60 font-light">
                    {story.creator}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="absolute top-4 left-0 right-0 px-4">
            <div className="flex gap-1">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    index === activeStory ? 'bg-white' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}