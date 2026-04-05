import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import * as contrib from './create-3d-contrib';
import * as pie from './create-pie-language';
import * as radar from './create-radar-contrib';
import * as colors from './create-css-colors';
import * as util from './utils';
import * as type from './type';

const width = 1280;
const height = 850;

const pieHeight = 200 * 1.3;
const pieWidth = pieHeight * 2;

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
    if (settings.type === 'pie_lang_only') {
        svgWidth = pieWidth;
        svgHeight = pieHeight;
    } else if (settings.type === 'radar_contrib_only') {
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
    } else if (settings.type === 'pie_lang_only') {
        // pie chart only
        pie.createPieLanguage(
            svg,
            userInfo,
            0,
            0,
            pieWidth,
            pieHeight,
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

        // radar chart (top-right)
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

        // --- Horizontal stats bars (bottom-left, clear area) ---
        const barX = 30;
        const barY = height - 170;
        const barMaxW = 200;
        const barH = 8;
        const rowGap = 28;

        const stats = [
            { label: 'Commits', value: userInfo.totalCommitContributions },
            { label: 'Pull Requests', value: userInfo.totalPullRequestContributions },
            { label: 'Reviews', value: userInfo.totalPullRequestReviewContributions },
            { label: 'Issues', value: userInfo.totalIssueContributions },
            { label: 'Repos', value: userInfo.totalRepositoryContributions },
        ];

        const maxVal = Math.max(...stats.map((s) => s.value), 1);

        stats.forEach((stat, i) => {
            const y = barY + i * rowGap;
            const barW = Math.max((stat.value / maxVal) * barMaxW, 3);

            // label
            group.append('text')
                .style('font-size', '12px')
                .attr('x', barX)
                .attr('y', y)
                .text(stat.label)
                .attr('class', 'fill-fg');

            // bar background
            group.append('rect')
                .attr('x', barX + 90)
                .attr('y', y - 7)
                .attr('width', barMaxW)
                .attr('height', barH)
                .attr('rx', barH / 2)
                .attr('fill-opacity', 0.15)
                .attr('class', 'fill-fg');

            // bar fill
            const bar = group.append('rect')
                .attr('x', barX + 90)
                .attr('y', y - 7)
                .attr('height', barH)
                .attr('rx', barH / 2)
                .attr('class', 'radar');

            if (isForcedAnimation) {
                bar.attr('width', 0);
                bar.append('animate')
                    .attr('attributeName', 'width')
                    .attr('from', '0')
                    .attr('to', String(barW))
                    .attr('dur', '1.2s')
                    .attr('fill', 'freeze')
                    .attr('begin', `${0.3 + i * 0.1}s`);
            } else {
                bar.attr('width', barW);
            }

            // value
            group.append('text')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .attr('x', barX + 90 + barMaxW + 10)
                .attr('y', y)
                .text(util.inertThousandSeparator(stat.value))
                .attr('class', 'fill-fg');
        });

        // --- Total contributions (bottom center) ---
        const positionXContrib = (width * 3) / 10;
        const positionYContrib = height - 20;

        group
            .append('text')
            .style('font-size', '32px')
            .style('font-weight', 'bold')
            .attr('x', positionXContrib)
            .attr('y', positionYContrib)
            .attr('text-anchor', 'end')
            .text(util.inertThousandSeparator(userInfo.totalContributions))
            .attr('class', 'fill-strong');

        const contribLabel = ('l10n' in settings && settings.l10n)
            ? settings.l10n.contrib
            : 'contributions';
        group
            .append('text')
            .style('font-size', '24px')
            .attr('x', positionXContrib + 10)
            .attr('y', positionYContrib)
            .attr('text-anchor', 'start')
            .text(contribLabel)
            .attr('class', 'fill-fg');

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
