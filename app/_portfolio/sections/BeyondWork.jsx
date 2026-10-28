import Image from "next/image";
import { beyondWork } from "../../data/siteData";
import Rail from "../islands/Rail";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function BeyondWork() {
  return (
    <section id="beyond" className="py-section" aria-labelledby="beyond-title">
      <SectionHeading id="beyond-title" eyebrow="Off the clock" title="Beyond Work">
        Travelling, good food, family time, animals, surfing, the gym and stand-up comedy.
      </SectionHeading>
      <Rail label="Photos">
        {beyondWork.map((photo, index) => (
          <li key={photo.src} className="w-[70vw] shrink-0 snap-start sm:w-[40vw] md:w-[26vw] lg:w-[21vw]">
            <Reveal delay={index * 0.06}>
              <div className="group relative aspect-[4/5] overflow-hidden rounded-md">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 21vw, (min-width: 768px) 26vw, 70vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                  style={{ objectPosition: photo.position }}
                />
              </div>
            </Reveal>
          </li>
        ))}
      </Rail>
    </section>
  );
}
