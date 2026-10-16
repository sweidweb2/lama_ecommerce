import Image from "next/image";
import Link from "@/components/ui/link";
import { HOME_CLUB_MEMBERSHIP } from "@/lib/constants/home-marketing";

export function ClubMembership() {
    return (
        <section className="bg-background py-10 md:py-14">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href={HOME_CLUB_MEMBERSHIP.href}
                    className="group relative block aspect-[2172/724] w-full overflow-hidden rounded-2xl bg-muted"
                    aria-label={HOME_CLUB_MEMBERSHIP.alt}
                >
                    <Image
                        src={HOME_CLUB_MEMBERSHIP.image}
                        alt={HOME_CLUB_MEMBERSHIP.alt}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
                        sizes="(max-width: 1280px) 100vw, 1200px"
                        priority={false}
                    />
                </Link>
            </div>
        </section>
    );
}
