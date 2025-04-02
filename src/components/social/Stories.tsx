import React from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import useSound from 'use-sound';
import { Verified } from 'lucide-react';

interface Story {
  id: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  image: string;
  title: string;
  views: number;
}

const stories: Story[] = [
  {
    id: '1',
    creator: {
      name: 'Tech Innovators',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
      verified: true
    },
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    title: 'New AI Development',
    views: 12500
  },
  {
    id: '2',
    creator: {
      name: 'Space Labs',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
      verified: true
    },
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=2378&q=80',
    title: 'Space Tech Innovation',
    views: 8300
  }
];

export function Stories() {
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
    <section className="py-6">
      <div className="px-4">
        <h2 className="text-sm font-light tracking-widest text-white/60 mb-4">
          TRENDING
        </h2>
        <div className="relative" {...handlers}>
          <div className="flex overflow-hidden rounded-2xl aspect-[9/16]">
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
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={story.creator.avatar}
                      alt={story.creator.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-white font-light">
                          {story.creator.name}
                        </span>
                        {story.creator.verified && (
                          <Verified className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-white/60">
                        {story.views.toLocaleString()} views
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-light text-white mb-2">
                    {story.title}
                  </h3>
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