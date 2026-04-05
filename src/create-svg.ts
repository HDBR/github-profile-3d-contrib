import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import * as contrib from './create-3d-contrib';
// pie chart removed — not useful with mostly private repos
import * as radar from './create-radar-contrib';
import * as colors from './create-css-colors';
import * as util from './utils';
import * as type from './type';

const width = 1280;
const height = 850;

const radarWidth = 400 * 1.3;
const radarHeight = (radarWidth * 3) / 4;
const radarX = width - radarWidth - 40;

export const createSvg = (
    userInfo: type.UserInfo,
    settings: type.Settings,
    isForcedAnimation: boolean,
): string => {
    let svgWidth = width;
    let svgHeight = height;
    if (settings.type === 'radar_contrib_only') {
        svgWidth = radarWidth;
        svgHeight = radarHeight;
    }

    const fakeDom = new JSDOM(
        '<!DOCTYPE html><html><body><div class="container"></div></body></html>',
    );
    const container = d3.select(fakeDom.window.document).select('.container');
    const svg = container
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    svg.append('style').html(
        [
            '* { font-family: "Ubuntu", "Helvetica", "Arial", sans-serif; }',
            colors.createCssColors(settings),
        ].join('\n'),
    );

    contrib.addDefines(svg, settings);

    // background
    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('class', 'fill-bg');

    if (settings.type === 'radar_contrib_only') {
        // radar chart only
        radar.createRadarContrib(
            svg,
            userInfo,
            0,
            0,
            radarWidth,
            radarHeight,
            settings,
            isForcedAnimation,
        );
    } else {
        // 3D-Contrib Calendar
        contrib.create3DContrib(
            svg,
            userInfo,
            0,
            0,
            width,
            height,
            settings,
            isForcedAnimation,
        );

        // radar chart
        radar.createRadarContrib(
            svg,
            userInfo,
            radarX,
            70,
            radarWidth,
            radarHeight,
            settings,
            isForcedAnimation,
        );

        const group = svg.append('g');

        // --- Stats footer bar ---
        const footerY = height - 50;
        const footerH = 50;

        // Semi-transparent footer background
        group.append('rect')
            .attr('x', 0)
            .attr('y', footerY)
            .attr('width', width)
            .attr('height', footerH)
            .attr('fill-opacity', 0.3)
            .attr('class', 'fill-bg');

        // Thin accent line at top of footer
        group.append('rect')
            .attr('x', 0)
            .attr('y', footerY)
            .attr('width', width)
            .attr('height', 1.5)
            .attr('fill-opacity', 0.4)
            .attr('class', 'radar');

        const contribLabel = settings.l10n
            ? settings.l10n.contrib
            : 'contributions';

        const items = [
            { num: util.inertThousandSeparator(userInfo.totalContributions), label: contribLabel, highlight: true },
            { num: util.inertThousandSeparator(userInfo.totalCommitContributions), label: 'commits', highlight: false },
            { num: util.inertThousandSeparator(userInfo.totalPullRequestContributions), label: 'pull requests', highlight: false },
            { num: util.inertThousandSeparator(userInfo.totalPullRequestReviewContributions), label: 'reviews', highlight: false },
            { num: util.inertThousandSeparator(userInfo.totalRepositoryContributions), label: 'repos', highlight: false },
        ];

        const totalItems = items.length;
        const sectionWidth = width / totalItems;

        items.forEach((item, i) => {
            const cx = sectionWidth * i + sectionWidth / 2;
            const cy = footerY + footerH / 2;

            // Number
            group
                .append('text')
                .style('font-size', item.highlight ? '22px' : '18px')
                .style('font-weight', 'bold')
                .attr('x', cx)
                .attr('y', cy - 4)
                .attr('text-anchor', 'middle')
                .text(item.num)
                .attr('class', item.highlight ? 'fill-strong' : 'fill-fg');

            // Label
            group
                .append('text')
                .style('font-size', '11px')
                .attr('x', cx)
                .attr('y', cy + 14)
                .attr('text-anchor', 'middle')
                .text(item.label)
                .attr('class', 'fill-weak');

            // Separator line (between items, not after last)
            if (i < totalItems - 1) {
                group.append('line')
                    .attr('x1', sectionWidth * (i + 1))
                    .attr('y1', footerY + 10)
                    .attr('x2', sectionWidth * (i + 1))
                    .attr('y2', footerY + footerH - 10)
                    .attr('stroke-opacity', 0.2)
                    .attr('stroke-width', 1)
                    .attr('class', 'stroke-fg');
            }
        });

        // --- Date range (top-right) ---
        const startDate = userInfo.contributionCalendar[0].date;
        const endDate =
            userInfo.contributionCalendar[
                userInfo.contributionCalendar.length - 1
            ].date;
        const period = `${util.toIsoDate(startDate)} / ${util.toIsoDate(
            endDate,
        )}`;

        group
            .append('text')
            .style('font-size', '16px')
            .attr('x', width - 20)
            .attr('y', 20)
            .attr('dominant-baseline', 'hanging')
            .attr('text-anchor', 'end')
            .text(period)
            .attr('class', 'fill-weak');
    }
    return container.html();
};
