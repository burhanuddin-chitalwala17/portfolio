"use client";

import Image from "next/image";
import { beyondWork } from "../../data/siteData";
import { Reveal } from "../fx";
import { Rail, SectionHeading } from "./Rail";

export default function BeyondWork() {
  return (
    <section id="beyond" className="py-section" aria-labelledby="beyond-title">
      <SectionHeading eyebrow="Off the clock" title={<span id="beyond-title">Beyond Work</span>}>
        Travel, good food, family, animals, the ocean, the gym and the odd stand-up stage.
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
